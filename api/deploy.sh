#!/bin/bash

# Exit on error
set -e

# --- Configuration - SET THESE TO YOUR EXISTING RESOURCE NAMES ---
FIXED_RESOURCE_GROUP="github-auth-resource-group"
FIXED_FUNCTION_APP_NAME="github-auth-function-20556"
# We'll always use this specific storage account name instead of generating a new one
FIXED_STORAGE_ACCOUNT_NAME="githubauth27054"
LOCATION="eastus"
# --- End Configuration ---

echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
# Temporarily disabling Node.js version check
# if [[ ! $NODE_VERSION =~ ^v22 ]]; then
#   echo "Error: Node.js version 22 is required for deployment."
#   echo "Current version: $NODE_VERSION"
#   exit 1
# fi
echo "Using Node.js $NODE_VERSION (version check bypassed for testing)"

echo "Target Resource Group: $FIXED_RESOURCE_GROUP"
echo "Target Function App Name: $FIXED_FUNCTION_APP_NAME"
echo "Target Storage Account Name: $FIXED_STORAGE_ACCOUNT_NAME"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Checking Azure CLI login status..."
az account show > /dev/null || { echo "Please login with 'az login'"; exit 1; }

# Check if Resource Group exists, create if not
if ! az group show --name "$FIXED_RESOURCE_GROUP" --output none 2>/dev/null; then
  echo "Creating resource group: $FIXED_RESOURCE_GROUP..."
  az group create --name "$FIXED_RESOURCE_GROUP" --location "$LOCATION"
else
  echo "Resource group '$FIXED_RESOURCE_GROUP' already exists."
fi

# Use the fixed storage account name - check if it exists first
STORAGE_ACCOUNT_NAME="$FIXED_STORAGE_ACCOUNT_NAME"
if ! az storage account show --name "$STORAGE_ACCOUNT_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --query name --output tsv 2>/dev/null; then
  echo "Creating storage account: $STORAGE_ACCOUNT_NAME in $LOCATION (first-time setup)..."
  az storage account create --name "$STORAGE_ACCOUNT_NAME" --location "$LOCATION" --resource-group "$FIXED_RESOURCE_GROUP" --sku Standard_LRS --kind StorageV2
else
  echo "Using existing storage account: $STORAGE_ACCOUNT_NAME"
fi

# Get the storage account key
STORAGE_ACCOUNT_KEY=$(az storage account keys list --account-name "$STORAGE_ACCOUNT_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --query "[0].value" -o tsv)

# Create the Checklists table if it doesn't exist
echo "Ensuring Checklists table exists..."
az storage table create --name "Checklists" --account-name "$STORAGE_ACCOUNT_NAME" --account-key "$STORAGE_ACCOUNT_KEY" || true

# Check if Function App exists, create if not
if ! az functionapp show --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --query name --output tsv 2>/dev/null; then
  echo "Creating function app: $FIXED_FUNCTION_APP_NAME..."
  az functionapp create --name "$FIXED_FUNCTION_APP_NAME" --storage-account "$STORAGE_ACCOUNT_NAME" --consumption-plan-location "$LOCATION" --resource-group "$FIXED_RESOURCE_GROUP" --runtime node --runtime-version 22 --functions-version 4 --os-type Linux
else
  echo "Function app '$FIXED_FUNCTION_APP_NAME' already exists. Will update."
fi

echo "Setting app configurations for $FIXED_FUNCTION_APP_NAME..."
az functionapp config appsettings set --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --settings \
  "GITHUB_CLIENT_ID=Ov23lid8MA0Pb0EStu9w" \
  "GITHUB_CLIENT_SECRET=ff39a41694e61ce0f8f8a2728d08241bd97cc04e" \
  "ALLOWED_ORIGINS=https://checklist.codein.ca" \
  "WEBSITE_NODE_DEFAULT_VERSION=~22" \
  "FUNCTIONS_EXTENSION_VERSION=~4" \
  "FUNCTIONS_WORKER_RUNTIME=node" \
  "AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_NAME" \
  "AZURE_STORAGE_ACCOUNT_KEY=$STORAGE_ACCOUNT_KEY"

echo "Configuring CORS for $FIXED_FUNCTION_APP_NAME..."
# Get current CORS settings
CURRENT_CORS=$(az functionapp cors show --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP")
# Remove any existing origins except the production one
for ORIGIN in $(echo $CURRENT_CORS | jq -r '.allowedOrigins[]' | grep -v 'checklist.codein.ca'); do
  echo "Removing CORS origin: $ORIGIN"
  az functionapp cors remove --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --allowed-origins "$ORIGIN" > /dev/null
done
# Ensure the production origin is in the list
az functionapp cors add --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --allowed-origins "https://checklist.codein.ca"

echo "Building function app..."
cd "$SCRIPT_DIR"
npm run build

echo "Deploying function app to $FIXED_FUNCTION_APP_NAME..."
func azure functionapp publish "$FIXED_FUNCTION_APP_NAME" --node-version 22 --force

# Get the function URL for the fixed function app name
echo "Getting function URL for $FIXED_FUNCTION_APP_NAME..."
FUNCTION_URL=$(az functionapp function show --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --function-name githubAuth --query "invokeUrlTemplate" --output tsv)

echo "Deployment to $FIXED_FUNCTION_APP_NAME completed successfully!"
echo "Function URL: $FUNCTION_URL"
echo ""
echo "Ensure AuthContext.tsx uses this URL for production:"
echo "const AZURE_FUNCTION_URL = '$FUNCTION_URL';"
echo ""
echo "Ensure your GitHub OAuth App callback URL is: $FUNCTION_URL"

echo "Ensuring FUNCTIONS_WORKER_RUNTIME is set to node..."
az functionapp config appsettings set -g "$FIXED_RESOURCE_GROUP" -n "$FIXED_FUNCTION_APP_NAME" --settings \
  FUNCTIONS_WORKER_RUNTIME=node \
  WEBSITE_NODE_DEFAULT_VERSION="~22" \
  GITHUB_CLIENT_ID="Ov23lid8MA0Pb0EStu9w" \
  GITHUB_CLIENT_SECRET="ff39a41694e61ce0f8f8a2728d08241bd97cc04e" \
  ALLOWED_ORIGINS="https://checklist.codein.ca" \
  AZURE_STORAGE_ACCOUNT_NAME="$STORAGE_ACCOUNT_NAME" \
  AZURE_STORAGE_ACCOUNT_KEY="$STORAGE_ACCOUNT_KEY" > /dev/null
if [ $? -ne 0 ]; then
  echo "Failed to update app settings for $FIXED_FUNCTION_APP_NAME. Exiting."
  exit 1
fi
echo "App settings updated for $FIXED_FUNCTION_APP_NAME." 