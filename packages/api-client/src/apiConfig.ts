/**
 * API Configuration with sessionStorage persistence
 * Handles CSRF tokens, auth tokens, and API calls with proper headers
 */

const SESSION_STORAGE_KEYS = {
  CSRF_TOKEN: "kalki_csrf_token",
  AUTH_TOKEN: "kalki_auth_token",
  HOST_URL: "kalki_host_url",
  USER_EMAIL: "kalki_user_email",
} as const;

type ApiConfig = {
  hostUrl: string;
  csrfToken: string | null;
  authToken: string | null;
  isInitialized: boolean;
};

const apiConfig: ApiConfig = {
  hostUrl: "",
  csrfToken: null,
  authToken: null,
  isInitialized: false,
};

const LOCAL_HOST = "testall.kalki.io";

// Set to true to use mock data (useful for CORS issues during development)
// Set to false to use real API
// TODO: Change this to false once CORS is resolved
const USE_MOCK_AUTH = true;

/**
 * Check if running in local environment
 */
const isLocal = (): boolean => {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
};

/**
 * Restore tokens from sessionStorage
 */
const restoreFromSessionStorage = (): void => {
  try {
    apiConfig.csrfToken = sessionStorage.getItem(SESSION_STORAGE_KEYS.CSRF_TOKEN);
    apiConfig.authToken = sessionStorage.getItem(SESSION_STORAGE_KEYS.AUTH_TOKEN);
    apiConfig.hostUrl = sessionStorage.getItem(SESSION_STORAGE_KEYS.HOST_URL) || "";
  } catch (error) {
    console.warn("[apiConfig] Failed to restore from sessionStorage:", error);
    // Clear potentially corrupted data
    clearSessionStorage();
  }
};

/**
 * Save tokens to sessionStorage
 */
const saveToSessionStorage = (): void => {
  try {
    if (apiConfig.csrfToken) {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.CSRF_TOKEN, apiConfig.csrfToken);
    }
    if (apiConfig.authToken) {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.AUTH_TOKEN, apiConfig.authToken);
    }
    if (apiConfig.hostUrl) {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.HOST_URL, apiConfig.hostUrl);
    }
  } catch (error) {
    console.warn("[apiConfig] Failed to save to sessionStorage:", error);
  }
};

/**
 * Clear all tokens from sessionStorage and memory
 */
export const clearSessionStorage = (): void => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.CSRF_TOKEN);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.HOST_URL);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.USER_EMAIL);
  } catch (error) {
    console.warn("[apiConfig] Failed to clear sessionStorage:", error);
  }
  
  // Clear from memory
  apiConfig.csrfToken = null;
  apiConfig.authToken = null;
  apiConfig.hostUrl = "";
  apiConfig.isInitialized = false;
};

/**
 * Set authentication tokens (called after successful login)
 */
export const setAuthTokens = (
  csrfToken: string | null,
  authToken: string | null,
  hostUrl?: string,
  userEmail?: string
): void => {
  apiConfig.csrfToken = csrfToken;
  apiConfig.authToken = authToken;
  if (hostUrl) {
    apiConfig.hostUrl = hostUrl;
  }
  
  // Save user email if provided
  if (userEmail) {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.USER_EMAIL, userEmail);
    } catch (error) {
      console.warn("[apiConfig] Failed to save user email:", error);
    }
  }
  
  saveToSessionStorage();
};

/**
 * Get user email from sessionStorage
 */
export const getUserEmail = (): string | null => {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEYS.USER_EMAIL);
  } catch (error) {
    console.warn("[apiConfig] Failed to get user email:", error);
    return null;
  }
};

/**
 * Initialize local development configuration
 * Only sets up host URL, does NOT authenticate
 * Authentication should be done through login form
 */
const initializeLocalConfig = (): void => {
  // Set host URL for local development
  apiConfig.hostUrl = apiConfig.hostUrl || `https://${LOCAL_HOST}`;
  apiConfig.isInitialized = true;
};

/**
 * Initialize API configuration
 * Restores from sessionStorage or authenticates if needed
 */
export const initializeApi = async (): Promise<ApiConfig> => {
  if (apiConfig.isInitialized) return apiConfig;

  // First, try to restore from sessionStorage
  restoreFromSessionStorage();

  if (isLocal()) {
    // For local: just initialize config (host URL)
    // Authentication should be done through login form, not auto-authenticate
    initializeLocalConfig();
  } else {
    // For production: only use tokens from sessionStorage
    // If no tokens in sessionStorage, user needs to login
    apiConfig.hostUrl = apiConfig.hostUrl || `${window.location.protocol}//${window.location.host}`;
    apiConfig.isInitialized = true;
  }

  return apiConfig;
};

/**
 * Make API call with proper headers
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  // Ensure API is initialized
  if (!apiConfig.isInitialized) {
    await initializeApi();
  }

  // Build headers with CSRF and Auth tokens
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(apiConfig.csrfToken && { "X-Kalki-CSRF": apiConfig.csrfToken }),
    ...(apiConfig.authToken && {
      Authorization: `Bearer ${apiConfig.authToken}`,
    }),
    ...options.headers,
  };

  const url = `${apiConfig.hostUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type");
    const responseData = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401) {
        // Clear tokens and mark as uninitialized
        clearSessionStorage();
        throw new Error("Authentication expired. Please login again.");
      }

      // Create error with proper message extraction
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      if (responseData && typeof responseData === "object") {
        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.errorCode) {
          errorMessage = responseData.errorCode;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
      } else if (typeof responseData === "string") {
        errorMessage = responseData;
      }

      const error = new Error(errorMessage) as Error & {
        status?: number;
        response?: Response;
        responseData?: any;
      };
      error.status = response.status;
      error.response = response;
      error.responseData = responseData;

      throw error;
    }

    return responseData;
  } catch (error) {
    // Re-throw if it's already our custom error
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    
    // Handle network errors
    console.error("[apiConfig] API call failed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Network error occurred"
    );
  }
};

/**
 * Get current API configuration (read-only)
 */
export const getApiConfig = (): Readonly<ApiConfig> => {
  return { ...apiConfig };
};

/**
 * Check if user is authenticated (has tokens)
 */
export const isAuthenticated = (): boolean => {
  return Boolean(apiConfig.authToken && apiConfig.csrfToken);
};

/**
 * Get mock authentication response (for CORS issues during development)
 */
export const getMockAuthResponse = (email: string) => {
  return {
    csrfToken: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBwb3J0QGthbGtpdGVjaC5pbiIsImVtYWlsIjoic3VwcG9ydEBrYWxraXRlY2guaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDA4NjQwMCwidXNlcklkIjoiMTIzNDU2Nzg5MCIsInJvbGUiOiJhZG1pbiJ9.abcdefghijklmnopqrstuvwxyz1234567890",
    hostUrl: "https://testall.kalki.io",
    user: {
      email: email,
      id: "1234567890",
      name: "Support User",
      role: "admin"
    },
    expiresIn: 86400,
    refreshToken: "refresh_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
  };
};

/**
 * Check if mock authentication should be used
 */
export const shouldUseMockAuth = (): boolean => {
  return USE_MOCK_AUTH;
};

