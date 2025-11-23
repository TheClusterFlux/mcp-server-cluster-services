# Context for AI - MCP Server Cluster Services

## Project Status

**Repository**: `mcp-server-cluster-services`  
**Location**: `/e/work/TheClusterFlux/mcp-server-cluster-services`  
**GitHub**: https://github.com/TheClusterFlux/mcp-server-cluster-services  
**Status**: Initial setup complete, ready for implementation

## What This Project Is

This is a **Model Context Protocol (MCP) Server** that enables Cursor (and other MCP clients) to discover, understand, and interact with Kubernetes-deployed services in TheClusterFlux cluster.

## Current State

- ✅ Repository created and pushed to GitHub
- ✅ Kubernetes deployment.yaml generated (via init.sh template)
- ✅ Project structure initialized
- ⏳ **Implementation needed**: All source code files

## Implementation Plan

Follow the detailed plan in: `../MCP_PHASE3_CLUSTER_SERVICES.md`

### Key Requirements

1. **7 Tools to Implement**:
   - `list_services` - List all services in cluster
   - `get_service_info` - Get detailed service information
   - `get_service_health` - Check service health
   - `discover_endpoints` - Discover API endpoints
   - `get_endpoint_schema` - Get request/response schemas
   - `test_endpoint` - Make safe read-only API calls
   - `get_api_documentation` - Retrieve API docs

2. **Technology Stack**:
   - TypeScript/Node.js
   - `@modelcontextprotocol/sdk` - MCP SDK
   - `@kubernetes/client-node` - Kubernetes API client
   - `axios` - HTTP client for API calls

3. **Project Structure** (to be created):
   ```
   mcp-server-cluster-services/
   ├── package.json          # ✅ Created
   ├── tsconfig.json          # ✅ Created
   ├── src/
   │   ├── index.ts          # Main MCP server entry point
   │   ├── config/
   │   │   └── services.ts   # Service registry
   │   ├── tools/            # Tool implementations (7 tools)
   │   ├── services/         # Kubernetes & HTTP clients
   │   └── utils/            # Validation, errors, rate limiting
   └── deployment.yaml       # ✅ Already exists
   ```

## Important Notes

- **This is an MCP Server**, not a web service - it communicates via stdio with MCP clients
- **Read-only operations only** - no modifications to cluster
- **Security**: Never expose secret values, only metadata
- **Service Registry**: Pre-configured services in `src/config/services.ts`:
  - frik-invoice-backend
  - big-brother-api
  - echelon-conquest
  - sqlite
  - homepage

## Next Steps

1. Complete the implementation following `MCP_PHASE3_CLUSTER_SERVICES.md`
2. Test locally with Cursor
3. Build Docker image
4. Deploy to cluster

## Reference Documents

- `../MCP_INTEGRATION_PLAN.md` - Overall MCP integration strategy
- `../MCP_PHASE3_CLUSTER_SERVICES.md` - Detailed Phase 3 implementation plan
- `../MCP_PHASE5_KUBERNETES.md` - Phase 5 plan (separate server)

## Current Directory

**ALWAYS work in**: `/e/work/TheClusterFlux/mcp-server-cluster-services`

**DO NOT** create files in `/e/work/TheClusterFlux/src/` - that's a different location!

