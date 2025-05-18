#!/bin/bash

# Variables
API_BASE_URL="https://checklist-api.codein.ca/api"
GITHUB_USER_ID="test-user-123"
# Generate a unique task ID for each run to avoid conflicts
TASK_ID="test-task-$(date +%s)"

# Color coding for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Azure Functions API ===${NC}"
echo "Base URL: $API_BASE_URL"
echo "GitHub User ID: $GITHUB_USER_ID"
echo "Task ID: $TASK_ID"
echo ""

# 1. Test setCompletion - Create/update a task completion
echo -e "${BLUE}1. Testing setCompletion (POST) - Creating a task completion${NC}"
set_response=$(curl -s -X POST "$API_BASE_URL/completion" \
  -H "Content-Type: application/json" \
  -H "x-github-user-id: $GITHUB_USER_ID" \
  -d "{
    \"taskIdentifier\": \"$TASK_ID\",
    \"completionData\": {
      \"status\": \"completed\",
      \"score\": 95,
      \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }
  }")

echo "Response: $set_response"
if [[ $set_response == *"saved successfully"* ]]; then
  echo -e "${GREEN}✓ setCompletion test passed${NC}"
else
  echo -e "${RED}✗ setCompletion test failed${NC}"
fi
echo ""

# 2. Test getCompletions - Retrieve completions for a user
echo -e "${BLUE}2. Testing getCompletions (GET) - Retrieving completions${NC}"
get_response=$(curl -s -X GET "$API_BASE_URL/completions?githubUserId=$GITHUB_USER_ID" \
  -H "x-github-user-id: $GITHUB_USER_ID")

echo "Response: $get_response"
if [[ $get_response == *"$TASK_ID"* ]]; then
  echo -e "${GREEN}✓ getCompletions test passed${NC}"
else
  echo -e "${RED}✗ getCompletions test failed${NC}"
fi
echo ""

# 3. Test deleteCompletion - Delete a specific completion
echo -e "${BLUE}3. Testing deleteCompletion (DELETE) - Deleting a completion${NC}"
delete_response=$(curl -s -X DELETE "$API_BASE_URL/completion?githubUserId=$GITHUB_USER_ID&taskIdentifier=$TASK_ID" \
  -H "x-github-user-id: $GITHUB_USER_ID")

echo "Response: $delete_response"
if [[ $delete_response == *"deleted successfully"* ]]; then
  echo -e "${GREEN}✓ deleteCompletion test passed${NC}"
else
  echo -e "${RED}✗ deleteCompletion test failed${NC}"
fi
echo ""

# 4. Verify deletion by trying to get the completions again
echo -e "${BLUE}4. Verifying deletion - Getting completions again${NC}"
verify_response=$(curl -s -X GET "$API_BASE_URL/completions?githubUserId=$GITHUB_USER_ID" \
  -H "x-github-user-id: $GITHUB_USER_ID")

echo "Response: $verify_response"
if [[ $verify_response != *"$TASK_ID"* ]]; then
  echo -e "${GREEN}✓ Verification test passed - Task was properly deleted${NC}"
else
  echo -e "${RED}✗ Verification test failed - Task still exists${NC}"
fi
echo ""

# 5. Test getAllChecklists - Retrieve all available checklists
echo -e "${BLUE}5. Testing getAllChecklists (GET) - Retrieving all checklists${NC}"
checklists_response=$(curl -s -X GET "$API_BASE_URL/checklists" \
  -H "x-github-user-id: $GITHUB_USER_ID")

echo "Response: $checklists_response"
if [[ $checklists_response == *"checklists"* || $checklists_response == *"["* ]]; then
  echo -e "${GREEN}✓ getAllChecklists test passed${NC}"
else
  echo -e "${RED}✗ getAllChecklists test failed${NC}"
fi
echo ""

echo -e "${BLUE}All tests completed.${NC}" 