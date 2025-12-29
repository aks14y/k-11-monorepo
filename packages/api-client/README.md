# API Client

Shared package for making API calls with CSRF and authentication tokens.

## Usage in Feature Modules

### React Feature Modules

```typescript
import { apiFetch, getApiConfig } from "api-client";

// In your component
const MyFeature = ({ shellData }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Make API call using apiFetch
    // CSRF and auth tokens are automatically included
    apiFetch("/k11/api/v1.0/notifications")
      .then(response => {
        setData(response);
      })
      .catch(error => {
        console.error("API call failed:", error);
      });
  }, []);

  // Access tokens if needed
  const config = getApiConfig();
  const csrfToken = config.csrfToken;
  const authToken = config.authToken;

  return <div>{/* Your component */}</div>;
};
```

### Available Functions

- `apiFetch(endpoint, options)` - Make API calls with automatic token headers
- `getApiConfig()` - Get current API configuration (tokens, hostUrl)
- `isAuthenticated()` - Check if user has valid tokens
- `getUserEmail()` - Get user email from sessionStorage
- `setAuthTokens(csrfToken, authToken, hostUrl?, userEmail?)` - Set tokens (usually called by shell)
- `clearSessionStorage()` - Clear all tokens
- `initializeApi()` - Initialize API config (usually called by shell)

## How It Works

1. **SessionStorage**: Tokens are stored in `sessionStorage` and shared across the same origin
2. **Automatic Headers**: `apiFetch` automatically adds:
   - `X-Kalki-CSRF: <csrfToken>`
   - `Authorization: Bearer <authToken>`
3. **Error Handling**: Automatically handles 401 errors and token expiration

## Notes

- All feature modules (shell, k11-inbox, k11-monitoring) share the same `sessionStorage`
- Tokens are set by the shell after login
- Feature modules can immediately use `apiFetch` without additional setup

