# MCP Server - Cluster Services

MCP Server for discovering and interacting with cluster services in TheClusterFlux Kubernetes cluster.

## What This Does

This Model Context Protocol (MCP) server enables AI assistants (like Cursor) to:
- Discover services deployed in your Kubernetes cluster
- Understand API endpoints and their schemas
- Check service health status
- Make safe, read-only API calls to test endpoints
- Retrieve API documentation

## Status

✅ **Ready for Deployment** - Implementation complete

The server can run in two modes:
- **HTTP API Mode** (recommended for shared access): Deploy to cluster, developers connect via HTTPS with API keys
- **Stdio Mode** (for local development): Run locally, Cursor launches the process directly

## Tools Provided

1. `list_services` - List all services in cluster
2. `get_service_info` - Get detailed service information  
3. `get_service_health` - Check service health
4. `discover_endpoints` - Discover API endpoints
5. `get_endpoint_schema` - Get request/response schemas
6. `test_endpoint` - Make safe read-only API calls
7. `get_api_documentation` - Retrieve API docs

## Technology Stack

- TypeScript/Node.js
- Model Context Protocol SDK
- Express.js (for HTTP API mode)
- Kubernetes Client Node
- Axios for HTTP requests

## Quick Start

### For Developers (Using Deployed HTTP API)

1. Get an API key from your cluster administrator
2. Configure Cursor's MCP settings (see [API_USAGE.md](./API_USAGE.md))
3. Start using the tools in Cursor!

### For Local Development

```bash
npm install
npm run build
npm start        # Stdio mode (for local Cursor integration)
npm run start:http  # HTTP mode (for testing)
```

## Documentation

- **[API_USAGE.md](./API_USAGE.md)** - How to connect Cursor to the HTTP API
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - How to deploy to Kubernetes
- **[k8s-secret-example.yaml](./k8s-secret-example.yaml)** - API key secret template

## Security

- **Read-only operations** - Only safe HTTP methods (GET, HEAD, OPTIONS)
- **API key authentication** - Fail-safe by default (requires keys unless dev mode enabled)
- **Rate limiting** - 100 requests/minute per API key
- **SSRF protection** - Only allows cluster-internal service requests
- **HTTPS enforcement** - Only accepts HTTPS requests (except localhost for dev)
- **Input validation** - All inputs validated and sanitized
- **Error sanitization** - No sensitive information leaked in errors
- **Request size limits** - 1MB max payload size
- **CORS** - Allows same-domain requests (for future website integration)
