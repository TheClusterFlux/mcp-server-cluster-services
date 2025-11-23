# Deployment Guide

## Building the Docker Image

```bash
# Build the image
docker build -t docker.io/keanuwatts/theclusterflux:mcp-server-cluster-services .

# Push to registry
docker push docker.io/keanuwatts/theclusterflux:mcp-server-cluster-services
```

## Setting Up API Keys

Before deploying, create a Kubernetes secret with API keys:

```bash
# Create secret with comma-separated API keys
kubectl create secret generic mcp-server-api-keys \
  --from-literal=api-keys="dev-key-1,dev-key-2,admin-key-1" \
  --namespace=default
```

Or use the example file:
```bash
# Edit k8s-secret-example.yaml with your API keys, then:
kubectl apply -f k8s-secret-example.yaml
```

## Deploying to Kubernetes

```bash
# Apply the deployment
kubectl apply -f deployment.yaml
```

The deployment will:
- Run the HTTP API server on port 8080
- Expose it via Service and Ingress
- Use the ServiceAccount with read-only Kubernetes permissions
- Require API key authentication for all requests

## How It Works

**HTTP API Mode (Deployed):**
- Server runs as an HTTP REST API
- Developers connect via HTTPS with API keys
- No local installation needed
- Accessible at: `https://mcp-cluster-services.theclusterflux.com`

**Stdio Mode (Local Development):**
- For local development/testing
- Run: `npm start` (uses stdio)
- Configure Cursor to launch the local process

## Usage

### For Developers (HTTP API)

See [API_USAGE.md](./API_USAGE.md) for detailed instructions on connecting Cursor to the HTTP API.

Quick setup in Cursor (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "cluster-services": {
      "url": "https://mcp-cluster-services.theclusterflux.com/api/v1",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

### For Local Development (Stdio)

```bash
npm install
npm run build
npm start  # Runs stdio server
```

Then configure Cursor to use the local process.

## Service Account Permissions

The deployment includes a ServiceAccount with read-only permissions:
- Read services, pods, endpoints
- Read deployments
- No write permissions (read-only)

## Verifying Deployment

```bash
# Check if pod is running
kubectl get pods -l app=mcp-server-cluster-services

# Check logs
kubectl logs -l app=mcp-server-cluster-services

# Test health endpoint
curl https://mcp-cluster-services.theclusterflux.com/health

# Test API (with API key)
curl -X POST https://mcp-cluster-services.theclusterflux.com/api/tools/list_services \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"namespace": "default"}'
```

## Environment Variables

- `PORT`: HTTP server port (default: 8080)
- `API_KEYS`: Comma-separated list of valid API keys (from Kubernetes secret)
- `DEV_MODE` or `DISABLE_AUTH`: Set to `"true"` to allow requests without API keys (development only)
- `NODE_ENV`: Set to `"production"` for production mode (enforces HTTPS, strict auth)

## Troubleshooting

- **Permission errors**: Ensure the ServiceAccount has proper RBAC permissions
- **401 Unauthorized**: Check that API_KEYS secret exists and contains your key
- **Connection issues**: Verify ingress is configured correctly
- **Build errors**: Ensure all dependencies are in package.json
