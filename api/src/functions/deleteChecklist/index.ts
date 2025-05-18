import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

// These should be configured in your Function App's settings
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const tableName = "Checklists";

// Initialize the Table client only when the function is called
function getTableClient() {
  const credential = new AzureNamedKeyCredential(storageAccountName!, storageAccountKey!);
  return new TableClient(
    `https://${storageAccountName}.table.core.windows.net`,
    tableName,
    credential
  );
}

const deleteChecklist = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for deleteChecklist.");
  
  // Log the full request URL and headers for debugging
  context.log(`Request URL: ${request.url}`);
  context.log(`Request Headers: ${JSON.stringify(Object.fromEntries(request.headers))}`);

  // Get the authenticated user ID from header
  const authenticatedUserId = request.headers.get("x-github-user-id");
  
  // Get query parameters
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const checklistName = url.searchParams.get("checklistName");
  
  context.log(`Auth User ID: ${authenticatedUserId}, Query userId: ${userId}, checklistName: ${checklistName}`);

  if (!authenticatedUserId) {
    context.log("Authentication required - missing x-github-user-id header");
    return {
      status: 401,
      body: JSON.stringify({ error: "Authentication required." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  if (!userId || !checklistName) {
    context.log(`Missing parameters: userId=${userId}, checklistName=${checklistName}`);
    return {
      status: 400,
      body: JSON.stringify({ error: "Both userId and checklistName are required as query parameters." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  // Ensure users can only delete their own data
  if (authenticatedUserId !== userId) {
    context.log(`Auth mismatch: authenticatedUserId=${authenticatedUserId}, userId=${userId}`);
    return {
      status: 403,
      body: JSON.stringify({ error: "You can only delete your own checklists." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  try {
    const tableClient = getTableClient();
    context.log(`Attempting to delete entity with partitionKey=${userId}, rowKey=${checklistName}`);
    
    // Delete the entity
    try {
      await tableClient.deleteEntity(userId, checklistName);
      context.log("Entity deleted successfully");
    } catch (error) {
      // If entity doesn't exist, that's fine - consider it deleted
      if ((error as any).statusCode !== 404) {
        context.log(`Error in deleteEntity: ${JSON.stringify(error)}`);
        throw error;
      } else {
        context.log(`Entity not found, considering it already deleted`);
      }
    }
    
    return {
      status: 200,
      body: JSON.stringify({ message: "Checklist deleted successfully." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  } catch (error) {
    context.log(`Error deleting checklist: ${error instanceof Error ? error.message : String(error)}`);
    return {
      status: 500,
      body: JSON.stringify({ error: "Failed to delete checklist." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};

app.http('deleteChecklist', {
  methods: ['DELETE'],
  route: 'checklist',
  authLevel: 'anonymous',
  handler: deleteChecklist
}); 