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

🚧 **In Development** - Implementation in progress

See `CONTEXT_FOR_AI.md` for current status and implementation details.

## Implementation Plan

Follow the detailed plan in `../MCP_PHASE3_CLUSTER_SERVICES.md`

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
- Kubernetes Client Node
- Axios for HTTP requests

## Setup

```bash
npm install
npm run build
npm start
```

## Configuration

Configure in Cursor's MCP settings to connect to this server.

## Security

- Read-only operations only
- No secret values exposed
- Rate limiting implemented
- Input validation on all tools
