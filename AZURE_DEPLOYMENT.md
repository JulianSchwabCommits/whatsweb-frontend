# Azure Deployment Guide

This guide explains how to manually deploy both the frontend and backend of your WhatsWeb chat application to Azure Container Instances in the Poland Central region.

## Prerequisites

- Azure CLI installed (`az`)
- Docker installed
- GitHub account with packages access

## Step 1: Setup Azure CLI

1. **Login to Azure**:
   ```bash
   az login
   ```

2. **Register required resource providers**:
   ```bash
   az provider register --namespace Microsoft.ContainerInstance
   az provider register --namespace Microsoft.ContainerRegistry
   ```

3. **Verify provider registration**:
   ```bash
   az provider show -n Microsoft.ContainerInstance --query "registrationState"
   az provider show -n Microsoft.ContainerRegistry --query "registrationState"
   ```

## Step 2: Create Azure Resource Group

```bash
az group create --name whatsweb-frontend-rg --location polandcentral
```

## Step 3: Prepare Docker Images

### Backend Deployment

1. **Build the backend image**:
   ```bash
   cd /path/to/whatsweb-backend
   docker build -t ghcr.io/yourusername/whatsweb-backend:latest .
   ```

2. **Login to GitHub Container Registry**:
   ```bash
   echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```

3. **Push backend image**:
   ```bash
   docker push ghcr.io/yourusername/whatsweb-backend:latest
   ```

### Frontend Preparation

1. **Update frontend to connect to backend**:
   Edit `src/App.js` and change the socket connection URL:
   ```javascript
   const socket = io('http://YOUR-BACKEND-URL:8080');
   ```

2. **Build React app**:
   ```bash
   cd /path/to/whatsweb-frontend
   npm run build
   ```

3. **Build and push frontend image**:
   ```bash
   docker build -t ghcr.io/yourusername/whatsweb-frontend:latest .
   docker push ghcr.io/yourusername/whatsweb-frontend:latest
   ```

## Step 4: Deploy Backend to Azure

```bash
az container create \
  --resource-group whatsweb-frontend-rg \
  --name whatsweb-backend \
  --image ghcr.io/yourusername/whatsweb-backend:latest \
  --location polandcentral \
  --dns-name-label whatsweb-backend-$(date +%s) \
  --ports 8080 \
  --cpu 1 \
  --memory 1.5 \
  --os-type Linux \
  --registry-login-server ghcr.io \
  --registry-username yourusername \
  --registry-password YOUR_GITHUB_TOKEN
```

**Note**: Save the backend URL from the output - you'll need it for the frontend.

## Step 5: Update Frontend Configuration

1. **Get backend URL**:
   ```bash
   az container show --resource-group whatsweb-frontend-rg --name whatsweb-backend --query "ipAddress.fqdn" -o tsv
   ```

2. **Update frontend code** with the actual backend URL:
   ```javascript
   const socket = io('http://whatsweb-backend-XXXXXXXXXX.polandcentral.azurecontainer.io:8080');
   ```

3. **Rebuild and push frontend**:
   ```bash
   npm run build
   docker build -t ghcr.io/yourusername/whatsweb-frontend:latest .
   docker push ghcr.io/yourusername/whatsweb-frontend:latest
   ```

## Step 6: Deploy Frontend to Azure

```bash
az container create \
  --resource-group whatsweb-frontend-rg \
  --name whatsweb-frontend \
  --image ghcr.io/yourusername/whatsweb-frontend:latest \
  --location polandcentral \
  --dns-name-label whatsweb-frontend-$(date +%s) \
  --ports 8080 \
  --cpu 1 \
  --memory 1.5 \
  --os-type Linux \
  --registry-login-server ghcr.io \
  --registry-username yourusername \
  --registry-password YOUR_GITHUB_TOKEN
```

## Step 7: Verify Deployment

1. **List all containers**:
   ```bash
   az container list --resource-group whatsweb-frontend-rg --output table
   ```

2. **Get container details**:
   ```bash
   az container show --resource-group whatsweb-frontend-rg --name whatsweb-frontend
   az container show --resource-group whatsweb-frontend-rg --name whatsweb-backend
   ```

3. **Test the application**:
   - Open the frontend URL in your browser
   - Test chat functionality

## Management Commands

### View Logs
```bash
# Backend logs
az container logs --resource-group whatsweb-frontend-rg --name whatsweb-backend

# Frontend logs
az container logs --resource-group whatsweb-frontend-rg --name whatsweb-frontend
```

### Restart Container
```bash
az container restart --resource-group whatsweb-frontend-rg --name whatsweb-frontend
az container restart --resource-group whatsweb-frontend-rg --name whatsweb-backend
```

### Stop Container
```bash
az container stop --resource-group whatsweb-frontend-rg --name whatsweb-frontend
az container stop --resource-group whatsweb-frontend-rg --name whatsweb-backend
```

### Delete Container
```bash
az container delete --resource-group whatsweb-frontend-rg --name whatsweb-frontend --yes
az container delete --resource-group whatsweb-frontend-rg --name whatsweb-backend --yes
```

### Update Container (Redeploy)
To update a container with a new image:
1. Delete the existing container
2. Push new image to registry
3. Create container again with same command

## GitHub Secrets Setup

For automated deployments, you can set up GitHub Actions with these secrets:

- `AZURE_CREDENTIALS`: Azure service principal credentials
- `GITHUB_TOKEN`: GitHub Personal Access Token with packages:write permission
- `AZURE_RESOURCE_GROUP`: whatsweb-frontend-rg
- `AZURE_LOCATION`: polandcentral

## Troubleshooting

### Common Issues

1. **Image pull errors**: Verify GitHub token has correct permissions and image exists
2. **Port conflicts**: Ensure your application listens on the correct port (8080)
3. **CORS issues**: Configure your backend to allow frontend domain
4. **Connection issues**: Verify the frontend is using the correct backend URL

### Check Container Status
```bash
az container show --resource-group whatsweb-frontend-rg --name CONTAINER_NAME --query "instanceView.state"
```

### View Container Events
```bash
az container show --resource-group whatsweb-frontend-rg --name CONTAINER_NAME --query "containers[0].instanceView.events"
```

## Security Notes

- Store GitHub tokens securely and rotate them regularly
- Consider using Azure Container Registry instead of GitHub Container Registry for production
- Use Azure Key Vault for sensitive configuration
- Implement proper authentication and authorization for your chat application

## Cost Optimization

- Use smaller container sizes for development
- Consider Azure Container Apps for auto-scaling
- Monitor resource usage and adjust CPU/memory allocation
- Delete unused resources to avoid charges

## Next Steps

- Set up custom domain names
- Implement SSL/HTTPS
- Add monitoring and logging
- Set up automated CI/CD pipelines
- Consider moving to Azure Kubernetes Service (AKS) for production