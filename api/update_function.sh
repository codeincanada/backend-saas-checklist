#!/bin/bash

# Exit on error
set -e

# Configuration
RESOURCE_GROUP="github-auth-resource-group"
FUNCTION_APP_NAME="github-auth-function-20556"

# Get current storage account info
echo "Getting current storage account info from function app..."
STORAGE_ACCOUNT_NAME=$(az functionapp config appsettings list --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "[?name=='AZURE_STORAGE_ACCOUNT_NAME'].value" -o tsv 2>/dev/null || echo "ghauthstore1a306d")
STORAGE_ACCOUNT_KEY=$(az functionapp config appsettings list --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "[?name=='AZURE_STORAGE_ACCOUNT_KEY'].value" -o tsv 2>/dev/null)

if [ -z "$STORAGE_ACCOUNT_KEY" ]; then
  echo "Getting storage account key for $STORAGE_ACCOUNT_NAME..."
  STORAGE_ACCOUNT_KEY=$(az storage account keys list --account-name "$STORAGE_ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP" --query "[0].value" -o tsv)
fi

echo "Updating Function App settings..."
az functionapp config appsettings set -g "$RESOURCE_GROUP" -n "$FUNCTION_APP_NAME" --settings \
  FUNCTIONS_WORKER_RUNTIME=node \
  WEBSITE_NODE_DEFAULT_VERSION="~22" \
  FUNCTIONS_EXTENSION_VERSION="~4" \
  GITHUB_CLIENT_ID="Ov23lid8MA0Pb0EStu9w" \
  GITHUB_CLIENT_SECRET="ff39a41694e61ce0f8f8a2728d08241bd97cc04e" \
  ALLOWED_ORIGINS="https://mellifluous-meringue-b16ddc.netlify.app" \
  AZURE_STORAGE_ACCOUNT_NAME="$STORAGE_ACCOUNT_NAME" \
  AZURE_STORAGE_ACCOUNT_KEY="$STORAGE_ACCOUNT_KEY" > /dev/null

echo "Configuring CORS settings..."
az functionapp cors add --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" \
  --allowed-origins "https://mellifluous-meringue-b16ddc.netlify.app"

echo "Redeploying function app..."
cd "$(dirname "$0")"
npm run build
func azure functionapp publish "$FUNCTION_APP_NAME" --node-version 22 --force

echo "Function app updated successfully!"
echo "Function URL: https://$FUNCTION_APP_NAME.azurewebsites.net/api/githubAuth" 