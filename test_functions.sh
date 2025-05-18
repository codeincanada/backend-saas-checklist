#!/bin/bash

# Variables
API_BASE_URL="https://checklist-api.codein.ca/api"
GITHUB_USER_ID="test-user-123"
# Generate a unique checklist ID for each run to avoid conflicts
CHECKLIST_ID="test-checklist-$(date +%s)"

# Color coding for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Azure Functions API ===${NC}"
echo "Base URL: $API_BASE_URL"
echo "GitHub User ID: $GITHUB_USER_ID"
echo "Checklist ID: $CHECKLIST_ID"
echo ""

# 1. Test addChecklist - Create a new checklist
echo -e "${BLUE}1. Testing addChecklist (POST) - Creating a new checklist${NC}"
add_response=$(curl -s -X POST "$API_BASE_URL/checklist" \
  -H "Content-Type: application/json" \
  -H "x-github-user-id: $GITHUB_USER_ID" \
  -d "{
    \"checklistName\": \"$CHECKLIST_ID\",
    \"content\": {
      \"sections\": [
        {
          \"title\": \"Section 1\",
          \"items\": [
            {\"text\": \"Task 1\", \"isCompleted\": false},
            {\"text\": \"Task 2\", \"isCompleted\": false}
          ]
        }
      ],
      \"lastUpdated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }
  }")

echo "Response: $add_response"
if [[ $add_response == *"saved successfully"* ]]; then
  echo -e "${GREEN}✓ addChecklist test passed${NC}"
else
  echo -e "${RED}✗ addChecklist test failed${NC}"
fi
echo ""

# 2. Test getAllChecklists - Retrieve all checklist IDs for the user
echo -e "${BLUE}2. Testing getAllChecklists (GET) - Retrieving all checklist IDs${NC}"
ids_response=$(curl -s -X GET "$API_BASE_URL/checklists" \
  -H "x-github-user-id: $GITHUB_USER_ID")

echo "Response: $ids_response"
if [[ $ids_response == *"$CHECKLIST_ID"* ]]; then
  echo -e "${GREEN}✓ getAllChecklists test passed${NC}"
else
  echo -e "${RED}✗ getAllChecklists test failed${NC}"
fi
echo ""

# 3. Test getChecklist - Retrieve a single checklist by name
echo -e "${BLUE}3. Testing getChecklist (GET) - Retrieving a single checklist${NC}"
get_response=$(curl -s -X GET "$API_BASE_URL/checklist/$CHECKLIST_ID" \
  -H "x-github-user-id: $GITHUB_USER_ID")

echo "Response: $get_response"
if [[ $get_response == *"$CHECKLIST_ID"* && $get_response == *"Section 1"* ]]; then
  echo -e "${GREEN}✓ getChecklist test passed${NC}"
else
  echo -e "${RED}✗ getChecklist test failed${NC}"
fi
echo ""

# 4. Test updateChecklist - Update an existing checklist
echo -e "${BLUE}4. Testing updateChecklist (PUT) - Updating a checklist${NC}"
update_response=$(curl -s -X PUT "$API_BASE_URL/checklist" \
  -H "Content-Type: application/json" \
  -H "x-github-user-id: $GITHUB_USER_ID" \
  -d "{
    \"checklistName\": \"$CHECKLIST_ID\",
    \"content\": {
      \"sections\": [
        {
          \"title\": \"Section 1 Updated\",
          \"items\": [
            {\"text\": \"Task 1\", \"isCompleted\": true},
            {\"text\": \"Task 2\", \"isCompleted\": false},
            {\"text\": \"Task 3\", \"isCompleted\": false}
          ]
        }
      ],
      \"lastUpdated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }
  }")

echo "Response: $update_response"
if [[ $update_response == *"updated successfully"* ]]; then
  echo -e "${GREEN}✓ updateChecklist test passed${NC}"
else
  echo -e "${RED}✗ updateChecklist test failed${NC}"
fi
echo ""

# 5. Verify update - Get the updated checklist
echo -e "${BLUE}5. Verifying update - Getting the updated checklist${NC}"
verify_update_response=$(curl -s -X GET "$API_BASE_URL/checklist/$CHECKLIST_ID" \
  -H "x-github-user-id: $GITHUB_USER_ID")

echo "Response: $verify_update_response"
if [[ $verify_update_response == *"Section 1 Updated"* && $verify_update_response == *"Task 3"* ]]; then
  echo -e "${GREEN}✓ Update verification test passed${NC}"
else
  echo -e "${RED}✗ Update verification test failed${NC}"
fi
echo ""

# 6. Test deleteChecklist - Delete a specific checklist
echo -e "${BLUE}6. Testing deleteChecklist (DELETE) - Deleting a checklist${NC}"
delete_response=$(curl -s -X DELETE "$API_BASE_URL/checklist?userId=$GITHUB_USER_ID&checklistName=$CHECKLIST_ID" \
  -H "x-github-user-id: $GITHUB_USER_ID")

echo "Response: $delete_response"
if [[ $delete_response == *"deleted successfully"* ]]; then
  echo -e "${GREEN}✓ deleteChecklist test passed${NC}"
else
  echo -e "${RED}✗ deleteChecklist test failed${NC}"
fi
echo ""

# 7. Verify deletion - Check IDs list again
echo -e "${BLUE}7. Verifying deletion - Checking IDs list again${NC}"
verify_response=$(curl -s -X GET "$API_BASE_URL/checklists" \
  -H "x-github-user-id: $GITHUB_USER_ID")

echo "Response: $verify_response"
if [[ $verify_response != *"$CHECKLIST_ID"* ]]; then
  echo -e "${GREEN}✓ Deletion verification test passed - Checklist was properly deleted${NC}"
else
  echo -e "${RED}✗ Deletion verification test failed - Checklist still exists${NC}"
fi
echo ""

echo -e "${BLUE}All tests completed.${NC}" 