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

  // Get the authenticated user ID from header
  const authenticatedUserId = request.headers.get("x-github-user-id");
  
  // Get query parameters
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const checklistName = url.searchParams.get("checklistName");

  if (!authenticatedUserId) {
    return {
      status: 401,
      body: JSON.stringify({ error: "Authentication required." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  if (!userId || !checklistName) {
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
    
    // Delete the entity
    try {
      await tableClient.deleteEntity(userId, checklistName);
    } catch (error) {
      // If entity doesn't exist, that's fine - consider it deleted
      if ((error as any).statusCode !== 404) {
        throw error;
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