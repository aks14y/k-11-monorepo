/**
 * API Client - Shared package for making API calls
 * Used by both shell and feature modules
 */

export {
  apiFetch,
  clearSessionStorage,
  getApiConfig,
  getMockAuthResponse,
  getUserEmail,
  initializeApi,
  isAuthenticated,
  setAuthTokens,
  shouldUseMockAuth,
} from "./apiConfig";

