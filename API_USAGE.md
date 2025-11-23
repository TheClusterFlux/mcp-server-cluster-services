# API Usage Guide

## For Developers: Connecting to the MCP Server

The MCP server is deployed as an HTTP API that you can access from anywhere. No need to run it locally!

## Configuration in Cursor

Add this to your Cursor MCP configuration file (`C:\Users\Keanu\.cursor\mcp.json` or similar):

```json
{
  "mcpServers": {
    "cluster-services": {
      "url": "https://mcp-cluster-services.theclusterflux.com/api/v1",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE",
        "Content-Type": "application/json"
      }
    }
  }
}
```

Or using the `X-API-Key` header:

```json
{
  "mcpServers": {
    "cluster-services": {
      "url": "https://mcp-cluster-services.theclusterflux.com/api/v1",
      "headers": {
        "X-API-Key": "YOUR_API_KEY_HERE",
        "Content-Type": "application/json"
      }
    }
  }
}
```

**Note**: The API is versioned. Use `/api/v1` for the current version. Legacy routes (`/api/tools`) will redirect to v1.

## API Endpoints

### Health Check
```bash
GET /health
```

### List Available Tools
```bash
GET /api/v1/tools
```

### Execute a Tool
```bash
POST /api/v1/tools/{toolName}
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "namespace": "default",
  "serviceName": "homepage",
  ...
}
```

**API Versioning**: All endpoints are under `/api/v1/`. Legacy routes will redirect.

## Available Tools

1. **list_services** - List all services in cluster
   ```bash
   POST /api/v1/tools/list_services
   Body: { "namespace": "default" }
   ```

2. **get_service_info** - Get detailed service information
   ```bash
   POST /api/v1/tools/get_service_info
   Body: { "serviceName": "homepage", "namespace": "default" }
   ```

3. **get_service_health** - Check service health
   ```bash
   POST /api/v1/tools/get_service_health
   Body: { "serviceName": "homepage" }
   ```

4. **discover_endpoints** - Discover API endpoints
   ```bash
   POST /api/v1/tools/discover_endpoints
   Body: { "serviceName": "homepage", "method": "auto" }
   ```

5. **get_endpoint_schema** - Get endpoint schema
   ```bash
   POST /api/v1/tools/get_endpoint_schema
   Body: { "serviceName": "homepage", "endpoint": "/api/cluster-metrics", "method": "GET" }
   ```

6. **test_endpoint** - Test an endpoint (read-only)
   ```bash
   POST /api/v1/tools/test_endpoint
   Body: { "serviceName": "homepage", "endpoint": "/health", "method": "GET" }
   ```

7. **get_api_documentation** - Get API documentation
   ```bash
   POST /api/v1/tools/get_api_documentation
   Body: { "serviceName": "homepage", "format": "auto" }
   ```

## Example: Using curl

```bash
# List services
curl -X POST https://mcp-cluster-services.theclusterflux.com/api/v1/tools/list_services \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"namespace": "default"}'

# Get service health
curl -X POST https://mcp-cluster-services.theclusterflux.com/api/v1/tools/get_service_health \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"serviceName": "homepage"}'
```

## Getting Your API Key

Contact your cluster administrator to get an API key. API keys are managed via Kubernetes secrets.

## Local Development (Optional)

If you want to run the stdio MCP server locally instead:

```bash
npm install
npm run build
npm start  # Runs stdio server
```

Then configure Cursor to use the local process instead of HTTP.

