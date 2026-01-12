# Multi-Domain API Configuration

This document explains how the multi-domain API setup works in TraqOps.

## Overview

The application automatically detects the current domain/subdomain and constructs API URLs dynamically. This allows the same codebase to work across multiple domains without any code changes.

## Domain Detection

The system extracts the subdomain from `window.location.hostname`:

- **Production**: `voltas.traqops.com` → domainName = `"voltas"`
- **Development**: `voltas.local.site` → domainName = `"voltas"`
- **Localhost**: `localhost` → domainName = `"default"`

## Environment Variables

### Development (.env.development)
```
VITE_API_PROTOCOL=https
VITE_API_PORT=4200
VITE_API_BASE_DOMAIN=local.site
```

### Production (.env.production)
```
VITE_API_PROTOCOL=https
VITE_API_BASE_DOMAIN=traqops.com
```

## API Base URL Construction

### Development
```
https://{domainName}.local.site:4200
```
Example: `https://voltas.local.site:4200`

### Production
```
https://{domainName}.traqops.com
```
Example: `https://voltas.traqops.com`

## Usage

### Import API Configuration
```javascript
import { domainName, apiBaseUrl, getApiUrl } from '../config/apiConfig'
```

### Use in API Calls
```javascript
import { apiService } from '../services/api'

// Login automatically includes domainName
const response = await apiService.login({
  email: 'user@example.com',
  password: 'password'
})
// Payload sent: {
//   email: 'user@example.com',
//   password: 'password',
//   domainName: 'voltas', // Auto-injected
//   emailLogin: true
// }
```

### Direct API Calls
```javascript
import api from '../services/api'

// Use the configured axios instance
const response = await api.get('/some-endpoint')
```

## Supported Domains

### Production
- cmrl-sms.traqops.com
- voltas.traqops.com
- sagtaur.traqops.com
- cmrl-em.traqops.com
- cmrl-inv.traqops.com
- cmrl-le.traqops.com
- bvg-sr.traqops.com
- sso.traqops.com

### Development
- cmrl-sms.local.site
- voltas.local.site
- sagtaur.local.site
- cmrl-em.local.site
- cmrl-inv.local.site
- cmrl-le.local.site
- bvg-sr.local.site
- sso.local.site

## Testing

1. **Local Development**: Access `https://voltas.local.site:4200`
2. **Production**: Deploy to `https://voltas.traqops.com`
3. **No Code Changes**: The same codebase works on all domains

## Debugging

In development mode, the API configuration is logged to the console:
```
🔧 API Configuration: {
  hostname: "voltas.local.site",
  domainName: "voltas",
  apiBaseUrl: "https://voltas.local.site:4200",
  environment: "development"
}
```

