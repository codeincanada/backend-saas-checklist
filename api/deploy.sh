#!/bin/bash

# Exit on error
set -e

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
if [[ ! $NODE_VERSION =~ ^v22 ]]; then
  echo "Error: Node.js version 22 is required for deployment."
  echo "Current version: $NODE_VERSION"
  echo "Please install or use Node.js version 22."
  exit 1
fi
echo "Using Node.js $NODE_VERSION"

# Get values from the user or use defaults
echo "Setting up Azure Function deployment..."
RESOURCE_GROUP=${1:-"github-auth-resource-group"}
LOCATION=${2:-"eastus"}
STORAGE_NAME=${3:-"githubauth$RANDOM"}
FUNCTION_APP_NAME=${4:-"github-auth-function-$RANDOM"}

echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Storage Account: $STORAGE_NAME"
echo "Function App Name: $FUNCTION_APP_NAME"

# Remember the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Ensure Azure CLI is logged in
echo "Checking Azure CLI login status..."
az account show > /dev/null || { echo "Please login with 'az login'"; exit 1; }

# Create a resource group
echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create a storage account
echo "Creating storage account..."
az storage account create --name $STORAGE_NAME --location $LOCATION --resource-group $RESOURCE_GROUP --sku Standard_LRS --kind StorageV2

# Get the storage connection string
echo "Getting storage connection string..."
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string --name $STORAGE_NAME --resource-group $RESOURCE_GROUP --query connectionString --output tsv)

# Create a function app
echo "Creating function app..."
az functionapp create --name $FUNCTION_APP_NAME --storage-account $STORAGE_NAME --consumption-plan-location $LOCATION --resource-group $RESOURCE_GROUP --runtime node --runtime-version 22 --functions-version 4

# Configure app settings
echo "Setting app configurations..."
az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --settings "GITHUB_CLIENT_ID=Ov23lid8MA0Pb0EStu9w"
az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --settings "GITHUB_CLIENT_SECRET=ff39a41694e61ce0f8f8a2728d08241bd97cc04e"
az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --settings "ALLOWED_ORIGINS=http://localhost:5173,https://mellifluous-meringue-b16ddc.netlify.app"
az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --settings "WEBSITE_NODE_DEFAULT_VERSION=~22"

# Enable CORS
echo "Configuring CORS..."
az functionapp cors add --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --allowed-origins "http://localhost:5173" "https://mellifluous-meringue-b16ddc.netlify.app"

# Build the function app
echo "Building function app..."
cd "$SCRIPT_DIR"
npm run build

# Deploy the function app
echo "Deploying function app..."
func azure functionapp publish $FUNCTION_APP_NAME --node-version 22 --force

# Get the function URL
echo "Getting function URL..."
FUNCTION_URL=$(az functionapp function show --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --function-name githubAuth --query "invokeUrlTemplate" --output tsv)

echo "Deployment completed successfully!"
echo "Function URL: $FUNCTION_URL"
echo ""
echo "Please update AuthContext.tsx with this URL:"
echo "const AZURE_FUNCTION_URL = import.meta.env.PROD ? '$FUNCTION_URL' : 'http://localhost:7071/api/githubAuth';"
echo ""
echo "Don't forget to update the GitHub OAuth App callback URL to: $FUNCTION_URL" 