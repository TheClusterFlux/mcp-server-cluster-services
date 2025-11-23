# Deployment Guide

## Building the Docker Image

```bash
# Build the image
docker build -t docker.io/keanuwatts/theclusterflux:mcp-server-cluster-services .

# Push to registry
docker push docker.io/keanuwatts/theclusterflux:mcp-server-cluster-services
```

## Deploying to Kubernetes

```bash
# Apply the deployment
kubectl apply -f deployment.yaml
```

## Important: How MCP Servers Work

**MCP servers communicate via stdio (standard input/output), NOT HTTP.**

This means:
- The server runs as a process that Cursor launches locally
- It communicates through stdin/stdout pipes
- The Kubernetes deployment is mainly for running it in-cluster with proper RBAC

## Usage Options

### Option 1: Run Locally (Recommended)

1. **Build and run locally:**
   ```bash
   npm install
   npm run build
   npm start
   ```

2. **Configure Cursor** (usually in `~/.cursor/mcp.json` or Cursor settings):
   ```json
   {
     "mcpServers": {
       "cluster-services": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-server-cluster-services/dist/index.js"],
         "env": {
           "KUBECONFIG": "/path/to/your/kubeconfig"
         }
       }
     }
   }
   ```

3. **Restart Cursor** - the server will launch automatically when needed.

### Option 2: Run in-Cluster (Advanced)

If you want to run it in the cluster and access it remotely:

1. **Deploy to cluster:**
   ```bash
   kubectl apply -f deployment.yaml
   ```

2. **Access via kubectl exec:**
   ```bash
   kubectl exec -it deployment/mcp-server-cluster-services -- node dist/index.js
   ```

3. **Or use port-forward with a wrapper** (requires additional HTTP wrapper service)

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

# Test the server (if running in-cluster)
kubectl exec -it deployment/mcp-server-cluster-services -- node dist/index.js
```

## Troubleshooting

- **Permission errors**: Ensure the ServiceAccount has proper RBAC permissions
- **Connection issues**: Verify kubeconfig is accessible
- **Build errors**: Ensure all dependencies are in package.json

