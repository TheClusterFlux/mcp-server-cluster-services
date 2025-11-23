# Code Review: Security, UX, and Standards

## 🔒 Security Issues

### Critical

1. **API Key Validation - Dev Mode Bypass**
   - **Location**: `src/config/auth.ts:18-20`
   - **Issue**: If no API_KEYS are configured, all requests are allowed
   - **Risk**: Production deployment without keys = open access
   - **Fix**: Require API_KEYS in production, fail closed

2. **No Rate Limiting on HTTP Endpoints**
   - **Location**: `src/httpServer.ts`
   - **Issue**: Rate limiter exists but not applied to HTTP routes
   - **Risk**: DDoS, abuse, resource exhaustion
   - **Fix**: Apply rate limiting middleware to all routes

3. **SSRF (Server-Side Request Forgery) Risk**
   - **Location**: `src/tools/testEndpoint.ts:38`
   - **Issue**: URL construction from user input without validation
   - **Risk**: Internal network scanning, data exfiltration
   - **Fix**: Validate URLs, whitelist allowed hosts/ports

4. **No Request Size Limits**
   - **Location**: `src/httpServer.ts:20`
   - **Issue**: `express.json()` has no size limit
   - **Risk**: Memory exhaustion attacks
   - **Fix**: Add `express.json({ limit: '1mb' })`

5. **No HTTPS Enforcement**
   - **Location**: All HTTP code
   - **Issue**: Relies on ingress, no code-level enforcement
   - **Risk**: Man-in-the-middle attacks
   - **Fix**: Add middleware to check `X-Forwarded-Proto` or reject non-HTTPS

### High Priority

6. **Error Information Leakage**
   - **Location**: `src/httpServer.ts:134-136`
   - **Issue**: Full error messages exposed to clients
   - **Risk**: Stack traces, internal paths, sensitive info
   - **Fix**: Use `sanitizeError()` consistently

7. **No CORS Configuration**
   - **Location**: `src/httpServer.ts`
   - **Issue**: No CORS headers, browser requests will fail
   - **Risk**: If browser access needed, CORS required
   - **Fix**: Add CORS middleware if needed, or explicitly deny

8. **URL Construction Vulnerabilities**
   - **Location**: `src/tools/testEndpoint.ts:38`
   - **Issue**: `new URL()` can be manipulated
   - **Risk**: Protocol switching, host injection
   - **Fix**: Validate and sanitize URL components

9. **No Input Sanitization for Headers**
   - **Location**: `src/utils/validation.ts:138-155`
   - **Issue**: Headers passed directly to HTTP client
   - **Risk**: Header injection attacks
   - **Fix**: Validate header names/values, block dangerous headers

### Medium Priority

10. **No Request ID Tracking**
    - **Location**: All HTTP handlers
    - **Issue**: Hard to trace requests in logs
    - **Risk**: Difficult debugging, no audit trail
    - **Fix**: Add request ID middleware

11. **Console Logging in Production**
    - **Location**: Multiple files
    - **Issue**: `console.log` used instead of proper logger
    - **Risk**: Performance, no log levels, hard to filter
    - **Fix**: Use structured logging library (winston, pino)

12. **No Health Check Dependencies**
    - **Location**: `src/httpServer.ts:73-75`
    - **Issue**: Health endpoint doesn't check K8s connectivity
    - **Risk**: False positives, service appears healthy but can't function
    - **Fix**: Add dependency checks (K8s API, etc.)

## 🎨 UX Issues

### High Priority

1. **No API Versioning**
   - **Location**: All endpoints
   - **Issue**: `/api/tools/...` - no version in path
   - **Impact**: Breaking changes affect all clients
   - **Fix**: Use `/api/v1/tools/...`

2. **Inconsistent Error Response Format**
   - **Location**: Multiple files
   - **Issue**: Some errors return `{ error: "..." }`, others different formats
   - **Impact**: Hard for clients to handle errors consistently
   - **Fix**: Standardize error response format

3. **No Request/Response Logging**
   - **Location**: HTTP server
   - **Issue**: No way to debug what requests were made
   - **Impact**: Difficult troubleshooting
   - **Fix**: Add request/response logging middleware

4. **Health Endpoint Too Simple**
   - **Location**: `src/httpServer.ts:73-75`
   - **Issue**: Only returns static JSON
   - **Impact**: Doesn't indicate if service can actually work
   - **Fix**: Check K8s connectivity, return detailed status

5. **No OpenAPI/Swagger Documentation**
   - **Location**: Missing
   - **Issue**: No machine-readable API docs
   - **Impact**: Hard for developers to discover API
   - **Fix**: Add OpenAPI spec generation

### Medium Priority

6. **Tool List is Hardcoded**
   - **Location**: `src/httpServer.ts:78-90`
   - **Issue**: Tools list not dynamically generated
   - **Impact**: Out of sync if tools change
   - **Fix**: Generate from actual tool registry

7. **No Pagination Support**
   - **Location**: `src/tools/listServices.ts`
   - **Issue**: Could return huge lists
   - **Impact**: Performance, memory issues
   - **Fix**: Add pagination parameters

8. **Error Messages Not User-Friendly**
   - **Location**: Various validation errors
   - **Issue**: Technical error messages
   - **Impact**: Confusing for end users
   - **Fix**: Add user-friendly error messages

## 📐 Standards Issues

### TypeScript Best Practices

1. **Excessive Use of `any` Type**
   - **Location**: Multiple files (`src/httpServer.ts:44, 98`, etc.)
   - **Issue**: Defeats TypeScript's type safety
   - **Fix**: Define proper interfaces/types

2. **Missing Type Definitions**
   - **Location**: Request/Response types
   - **Issue**: No interfaces for API requests/responses
   - **Fix**: Create `src/types/api.ts` with all types

3. **Type Assertions Without Validation**
   - **Location**: `src/httpServer.ts:36` - `(req as any).apiKey`
   - **Issue**: Bypasses type checking
   - **Fix**: Extend Express Request type properly

### Code Organization

4. **No Error Handling Middleware**
   - **Location**: `src/httpServer.ts`
   - **Issue**: Errors handled in each route
   - **Fix**: Add Express error handling middleware

5. **Missing JSDoc Comments**
   - **Location**: Some functions lack documentation
   - **Issue**: Hard to understand function purpose
   - **Fix**: Add comprehensive JSDoc

6. **Magic Numbers**
   - **Location**: Timeouts, limits scattered in code
   - **Issue**: Hard to configure, maintain
   - **Fix**: Move to config constants

### Code Quality

7. **Inconsistent Error Handling**
   - **Location**: Some tools return errors, others throw
   - **Issue**: Inconsistent patterns
   - **Fix**: Standardize error handling pattern

8. **No Input Size Validation**
   - **Location**: Validation functions
   - **Issue**: No max length checks on strings
   - **Fix**: Add size limits to validators

9. **Duplicate Code**
   - **Location**: `src/tools/testEndpoint.ts:62-97` (port retry logic)
   - **Issue**: Code duplication
   - **Fix**: Extract to helper function

## 🔧 Recommended Fixes Priority

### Immediate (Before Production)

1. ✅ Fix API key validation (fail closed in production)
2. ✅ Add rate limiting to HTTP endpoints
3. ✅ Add request size limits
4. ✅ Fix SSRF vulnerability in testEndpoint
5. ✅ Add proper error sanitization
6. ✅ Add HTTPS enforcement check

### High Priority

7. Add API versioning
8. Standardize error response format
9. Add request/response logging
10. Replace `any` types with proper interfaces
11. Add CORS configuration (if needed)

### Medium Priority

12. Add OpenAPI/Swagger spec
13. Improve health check
14. Add request ID tracking
15. Replace console.log with proper logger
16. Add pagination support

## 📝 Code Examples for Fixes

See implementation suggestions in separate sections below.

