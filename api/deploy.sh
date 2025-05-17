#!/bin/bash

# Exit on error
set -e

# --- Configuration - SET THESE TO YOUR EXISTING RESOURCE NAMES ---
FIXED_RESOURCE_GROUP="github-auth-resource-group"
FIXED_FUNCTION_APP_NAME="github-auth-function-20556"
# Attempt to derive storage name, or set it if it's fixed and known
# This is a bit tricky as storage names must be globally unique and are tied to the function app.
# If the function app already exists, we should query its storage account.
# For simplicity in this update, we'll assume it might need to be created if the RG is new.
FIXED_STORAGE_NAME_BASE="ghauthstore"
LOCATION="eastus"
# --- End Configuration ---

echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
if [[ ! $NODE_VERSION =~ ^v22 ]]; then
  echo "Error: Node.js version 22 is required for deployment."
  echo "Current version: $NODE_VERSION"
  exit 1
fi
echo "Using Node.js $NODE_VERSION"

echo "Target Resource Group: $FIXED_RESOURCE_GROUP"
echo "Target Function App Name: $FIXED_FUNCTION_APP_NAME"

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

# Function App specific storage name
# Try to get existing storage account if function app exists
STORAGE_ACCOUNT_NAME=""
if az functionapp show --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --query name --output tsv 2>/dev/null; then
    echo "Function App '$FIXED_FUNCTION_APP_NAME' exists. Querying its storage account."
    STORAGE_ACCOUNT_ID=$(az functionapp show --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --query "siteConfig.azureStorageAccounts.default.accountName" --output tsv)
    if [[ -n "$STORAGE_ACCOUNT_ID" ]]; then
        STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_ID
        echo "Using existing storage account: $STORAGE_ACCOUNT_NAME"
    fi
fi

# If storage account not found or function app doesn't exist yet, create a new one
if [[ -z "$STORAGE_ACCOUNT_NAME" ]]; then
    GENERATED_STORAGE_SUFFIX=$(head /dev/urandom | tr -dc a-z0-9 | head -c 6)
    STORAGE_ACCOUNT_NAME="${FIXED_STORAGE_NAME_BASE}${GENERATED_STORAGE_SUFFIX}"
    echo "Creating storage account: $STORAGE_ACCOUNT_NAME in $LOCATION..."
    az storage account create --name "$STORAGE_ACCOUNT_NAME" --location "$LOCATION" --resource-group "$FIXED_RESOURCE_GROUP" --sku Standard_LRS --kind StorageV2
fi

# Check if Function App exists, create if not
if ! az functionapp show --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --query name --output tsv 2>/dev/null; then
  echo "Creating function app: $FIXED_FUNCTION_APP_NAME..."
  az functionapp create --name "$FIXED_FUNCTION_APP_NAME" --storage-account "$STORAGE_ACCOUNT_NAME" --consumption-plan-location "$LOCATION" --resource-group "$FIXED_RESOURCE_GROUP" --runtime node --runtime-version 22 --functions-version 4 --os-type Linux
else
  echo "Function app '$FIXED_FUNCTION_APP_NAME' already exists. Will update."
fi

echo "Setting app configurations for $FIXED_FUNCTION_APP_NAME..."
az functionapp config set --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --linux-fx-version "NODE|22"
az functionapp config appsettings set --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --settings \
  "GITHUB_CLIENT_ID=Ov23lid8MA0Pb0EStu9w" \
  "GITHUB_CLIENT_SECRET=ff39a41694e61ce0f8f8a2728d08241bd97cc04e" \
  "ALLOWED_ORIGINS=http://localhost:5173,https://mellifluous-meringue-b16ddc.netlify.app" \
  "WEBSITE_NODE_DEFAULT_VERSION=~22" \
  "FUNCTIONS_EXTENSION_VERSION=~4" \
  "FUNCTIONS_WORKER_RUNTIME=node"

echo "Configuring CORS for $FIXED_FUNCTION_APP_NAME..."
az functionapp cors add --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --allowed-origins "http://localhost:5173" "https://mellifluous-meringue-b16ddc.netlify.app" # This command adds, it doesn't overwrite, which is usually fine.

echo "Building function app..."
cd "$SCRIPT_DIR"
npm run build

echo "Deploying function app to $FIXED_FUNCTION_APP_NAME..."
func azure functionapp publish "$FIXED_FUNCTION_APP_NAME" --node-version 22 --force

# Get the function URL for the fixed function app name
echo "Getting function URL for $FIXED_FUNCTION_APP_NAME..."
FUNCTION_URL=$(az functionapp function show --name "$FIXED_FUNCTION_APP_NAME" --resource-group "$FIXED_RESOURCE_GROUP" --function-name githubauth --query "invokeUrlTemplate" --output tsv)

echo "Deployment to $FIXED_FUNCTION_APP_NAME completed successfully!"
echo "Function URL: $FUNCTION_URL"
echo ""
echo "Ensure AuthContext.tsx uses this URL for production:"
echo "const AZURE_FUNCTION_URL = import.meta.env.PROD ? '$FUNCTION_URL' : 'http://localhost:7071/api/githubauth';"
echo ""
echo "Ensure your GitHub OAuth App callback URL is: $FUNCTION_URL" 