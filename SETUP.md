# Create resource group if not exists
az group create --name whatsweb-rg --location polandcentral

# Free tier (good for React frontend, static)
az appservice plan create \
    --name whatsweb-frontend-plan \
    --resource-group whatsweb-rg \
    --sku F1 \
    --is-linux


az webapp create \
    --name whatsweb-frontend \
    --resource-group whatsweb-rg \
    --plan whatsweb-frontend-plan
