## list containers in rg

az container list --resource-group whatsweb-rg --output table

## delete

### container

az container delete --resource-group whatsweb-rg --name whatsweb-frontend --yes

### rg

az group delete --name whatsweb-rg --yes --no-wait

# Manual Deployment

## Create rg

az group create --name whatsweb-rg --location polandcentral

## build image

docker build -t ghcr.io/julianschwabcommits/whatsweb-frontend:latest .

## login to docker for pushing

docker login ghcr.io -u julianschwabcommits

## push image

docker push ghcr.io/julianschwabcommits/whatsweb-frontend:latest

## deploy on azure

az container create \
 --resource-group whatsweb-rg \
 --name whatsweb-frontend \
 --image ghcr.io/julianschwabcommits/whatsweb-frontend:latest \
 --location polandcentral \
 --dns-name-label whatsweb-frontend \
 --ports 8080 \
 --cpu 1 \
 --memory 1.5 \
 --os-type Linux \
 --registry-login-server ghcr.io \
 --registry-username julianschwabcommits \
 --registry-password GITHUB_TOKEN
