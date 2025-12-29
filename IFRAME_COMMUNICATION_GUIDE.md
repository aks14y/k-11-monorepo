# Iframe Communication Guide for Legacy/External Apps

## Overview

This guide explains how to load legacy/external apps in iframes and securely pass data (tokens, user info, etc.) from the shell to the iframe.

## Current Implementation

Your current setup already supports iframe loading for Angular/legacy apps:

```typescript
// packages/plugin-loader/src/loaders/AngularLoader.ts
export class AngularLoader {
  async load(plugin: Plugin): Promise<LoadedAngularPlugin> {
    return { kind: "angular", iframeSrc: plugin.entryUrl };
  }
}
```

## Communication Methods

### Method 1: PostMessage API (Recommended) ⭐

**Best for:** Secure, cross-origin communication

**How it works:**
- Shell sends data via `postMessage` to iframe
- Iframe listens for messages via `message` event
- Both sides validate origin for security

**Implementation:**

#### Shell Side (DynamicRoute.tsx):
```typescript
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";

export const DynamicRoute = ({ plugin, userEmail }: DynamicRouteProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuth();
  const { authToken } = useAppContext();

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || loaded?.kind !== "angular") return;

    // Wait for iframe to load
    const handleLoad = () => {
      // Send initial data to iframe
      iframe.contentWindow?.postMessage(
        {
          type: "SHELL_INIT",
          payload: {
            token: authToken,
            userEmail: user?.email,
            user: user,
            // Add any other data you need
          },
        },
        plugin.entryUrl // Target origin (for security)
      );
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [loaded, plugin, authToken, user]);

  // Listen for messages FROM iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin (security!)
      if (event.origin !== new URL(plugin.entryUrl).origin) {
        console.warn("Invalid origin:", event.origin);
        return;
      }

      switch (event.data.type) {
        case "IFRAME_READY":
          // Iframe is ready, send data
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: "SHELL_INIT",
              payload: { token: authToken, userEmail: user?.email },
            },
            plugin.entryUrl
          );
          break;
        case "IFRAME_NAVIGATE":
          // Iframe wants to navigate
          // You can handle navigation in shell if needed
          break;
        case "IFRAME_ERROR":
          // Iframe reports an error
          console.error("Iframe error:", event.data.payload);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [plugin, authToken, user]);

  if (loaded?.kind === "angular") {
    return (
      <iframe
        ref={iframeRef}
        src={loaded.iframeSrc}
        className={styles.iframe}
        title={plugin.metadata.title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    );
  }
};
```

#### Iframe Side (Legacy App):
```javascript
// In your legacy app (Angular, Vue, vanilla JS, etc.)

// Listen for messages from shell
window.addEventListener("message", (event) => {
  // Validate origin (security!)
  const allowedOrigin = "https://your-shell-domain.com";
  if (event.origin !== allowedOrigin) {
    console.warn("Invalid origin:", event.origin);
    return;
  }

  if (event.data.type === "SHELL_INIT") {
    const { token, userEmail, user } = event.data.payload;
    
    // Store token for API calls
    localStorage.setItem("authToken", token);
    // Or use a global variable
    window.shellAuthToken = token;
    
    // Initialize your app with user data
    initializeApp(userEmail, user);
  }
});

// Notify shell when iframe is ready
window.parent.postMessage(
  { type: "IFRAME_READY" },
  "https://your-shell-domain.com"
);

// Example: Request new token when current one expires
function requestNewToken() {
  window.parent.postMessage(
    { type: "TOKEN_REFRESH_REQUEST" },
    "https://your-shell-domain.com"
  );
}
```

**Pros:**
- ✅ Secure (origin validation)
- ✅ Works cross-origin
- ✅ Standard browser API
- ✅ Framework agnostic
- ✅ Can pass complex objects

**Cons:**
- ⚠️ Requires coordination between shell and iframe
- ⚠️ Need to handle message format

---

### Method 2: URL Parameters (Simple but Limited)

**Best for:** Simple, one-way data passing

**Implementation:**

```typescript
// Shell side
const iframeSrc = `${plugin.entryUrl}?token=${encodeURIComponent(authToken)}&email=${encodeURIComponent(user?.email || "")}`;

return (
  <iframe
    src={iframeSrc}
    className={styles.iframe}
    title={plugin.metadata.title}
  />
);
```

**Iframe side:**
```javascript
// Legacy app reads from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
const email = urlParams.get("email");
```

**Pros:**
- ✅ Simple
- ✅ No coordination needed
- ✅ Works immediately

**Cons:**
- ❌ Token visible in URL (security risk!)
- ❌ Limited data size
- ❌ One-way only
- ❌ Browser history exposure

**Recommendation:** Only use for non-sensitive data or combine with postMessage.

---

### Method 3: Shared Storage (localStorage/sessionStorage)

**Best for:** Persistent data that both apps need

**Implementation:**

```typescript
// Shell side - Before loading iframe
useEffect(() => {
  if (authToken && user) {
    // Store in sessionStorage (cleared on tab close)
    sessionStorage.setItem("shell_auth_token", authToken);
    sessionStorage.setItem("shell_user_email", user.email);
    sessionStorage.setItem("shell_user", JSON.stringify(user));
  }
}, [authToken, user]);
```

**Iframe side:**
```javascript
// Legacy app reads from sessionStorage
const token = sessionStorage.getItem("shell_auth_token");
const email = sessionStorage.getItem("shell_user_email");
```

**Pros:**
- ✅ Simple
- ✅ Persistent across navigation
- ✅ No coordination needed

**Cons:**
- ❌ Same-origin only (if iframe is different origin, won't work)
- ❌ Security concerns (XSS attacks)
- ❌ Storage limits

**Recommendation:** Only use if iframe is same-origin, or combine with postMessage.

---

### Method 4: Custom Protocol/API Endpoint

**Best for:** Server-side token validation

**Implementation:**

```typescript
// Shell side - Create a temporary token endpoint
const tempToken = generateTempToken(authToken, plugin.id);
const iframeSrc = `${plugin.entryUrl}?tempToken=${tempToken}`;
```

**Backend:**
```java
// Your Java backend validates temp token
@GetMapping("/api/validate-temp-token")
public TokenResponse validateTempToken(@RequestParam String tempToken) {
    // Validate and return actual token
    return new TokenResponse(actualToken, userEmail);
}
```

**Iframe side:**
```javascript
// Legacy app requests token from backend
const tempToken = new URLSearchParams(window.location.search).get("tempToken");
fetch(`/api/validate-temp-token?tempToken=${tempToken}`)
  .then(res => res.json())
  .then(data => {
    const token = data.token;
    // Use token for API calls
  });
```

**Pros:**
- ✅ Most secure
- ✅ Server-side validation
- ✅ Token not exposed in URL
- ✅ Can revoke tokens

**Cons:**
- ❌ Requires backend changes
- ❌ Additional API call
- ❌ More complex

---

## Recommended Approach: Hybrid (PostMessage + URL)

**Best of both worlds:**

```typescript
// Enhanced DynamicRoute with postMessage
export const DynamicRoute = ({ plugin, userEmail }: DynamicRouteProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuth();
  const { authToken } = useAppContext();

  // Send data via postMessage when iframe loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || loaded?.kind !== "angular") return;

    const sendData = () => {
      iframe.contentWindow?.postMessage(
        {
          type: "SHELL_INIT",
          payload: {
            token: authToken,
            userEmail: user?.email,
            user: user,
            timestamp: Date.now(),
          },
        },
        new URL(plugin.entryUrl).origin
      );
    };

    iframe.addEventListener("load", sendData);
    
    // Also send after a short delay (in case iframe loads before listener is ready)
    const timeout = setTimeout(sendData, 1000);

    return () => {
      iframe.removeEventListener("load", sendData);
      clearTimeout(timeout);
    };
  }, [loaded, plugin, authToken, user]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const allowedOrigin = new URL(plugin.entryUrl).origin;
      if (event.origin !== allowedOrigin) return;

      switch (event.data.type) {
        case "IFRAME_READY":
          // Resend data
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: "SHELL_INIT",
              payload: { token: authToken, userEmail: user?.email, user },
            },
            allowedOrigin
          );
          break;
        case "TOKEN_REFRESH_REQUEST":
          // Handle token refresh
          // You can refresh token and send new one
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [plugin, authToken, user]);

  if (loaded?.kind === "angular") {
    return (
      <iframe
        ref={iframeRef}
        src={loaded.iframeSrc}
        className={styles.iframe}
        title={plugin.metadata.title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    );
  }
};
```

## Security Considerations

### 1. Origin Validation
Always validate message origins:
```typescript
const allowedOrigin = new URL(plugin.entryUrl).origin;
if (event.origin !== allowedOrigin) {
  return; // Reject message
}
```

### 2. Iframe Sandbox
Use sandbox attributes for security:
```typescript
<iframe
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  // Restricts iframe capabilities
/>
```

### 3. Token Expiration
Handle token expiration:
```typescript
// Shell side
case "TOKEN_REFRESH_REQUEST":
  const newToken = await refreshToken();
  iframeRef.current?.contentWindow?.postMessage(
    { type: "TOKEN_UPDATE", payload: { token: newToken } },
    allowedOrigin
  );
  break;
```

### 4. Content Security Policy (CSP)
Ensure CSP allows iframes:
```html
<meta http-equiv="Content-Security-Policy" 
      content="frame-src 'self' https://legacy-app.example.com;">
```

## Comparison Table

| Method | Security | Complexity | Cross-Origin | Two-Way | Recommended |
|--------|----------|-----------|--------------|---------|-------------|
| PostMessage | ✅ High | Medium | ✅ Yes | ✅ Yes | ⭐⭐⭐⭐⭐ |
| URL Params | ❌ Low | Low | ✅ Yes | ❌ No | ⭐⭐ |
| Shared Storage | ⚠️ Medium | Low | ❌ No | ❌ No | ⭐⭐⭐ |
| Custom API | ✅ High | High | ✅ Yes | ✅ Yes | ⭐⭐⭐⭐ |

## Implementation Steps

1. **Update DynamicRoute.tsx** to use postMessage
2. **Update Plugin type** to include communication config
3. **Create iframe communication helper** for reusable logic
4. **Document iframe integration** for client developers
5. **Add error handling** for failed communication

## Client Developer Guide

For clients developing legacy apps:

```javascript
// Template for legacy app integration
(function() {
  'use strict';

  const SHELL_ORIGIN = 'https://your-shell-domain.com';
  let authToken = null;
  let userEmail = null;

  // Listen for shell initialization
  window.addEventListener('message', (event) => {
    if (event.origin !== SHELL_ORIGIN) return;

    if (event.data.type === 'SHELL_INIT') {
      authToken = event.data.payload.token;
      userEmail = event.data.payload.userEmail;
      
      // Initialize your app
      initializeApp(authToken, userEmail);
    }

    if (event.data.type === 'TOKEN_UPDATE') {
      authToken = event.data.payload.token;
      updateToken(authToken);
    }
  });

  // Notify shell when ready
  window.parent.postMessage({ type: 'IFRAME_READY' }, SHELL_ORIGIN);

  // Use token for API calls
  function makeApiCall() {
    fetch('/api/data', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }
})();
```

## Conclusion

**Recommended:** Use **PostMessage API** for secure, two-way communication. It's the most flexible and secure option for passing tokens and data to iframe-based legacy apps.


