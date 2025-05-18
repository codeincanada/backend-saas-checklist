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

// Interface to define the expected structure of entities from Table Storage
interface ChecklistEntity {
  partitionKey: string; // userId (githubUserId)
  rowKey: string; // checklistName
  content: string; // JSON string with checklist content
  customLastUpdatedAt: string;
  timestamp: string; // Auto-added by Azure Tables
}

const getChecklist = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for getChecklist.");

  // Get the authenticated user ID from header
  const userId = request.headers.get("x-github-user-id");

  // Get the checklist name from the route parameter
  const checklistName = request.params.name;

  if (!userId) {
    return {
      status: 401,
      body: JSON.stringify({ error: "Authentication required." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  if (!checklistName) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Checklist name is required." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  try {
    const tableClient = getTableClient();
    
    // Try to get the specific checklist
    try {
      const entity = await tableClient.getEntity<ChecklistEntity>(userId, checklistName);
      
      return {
        status: 200,
        body: JSON.stringify({
          checklistName: entity.rowKey,
          content: JSON.parse(entity.content),
          lastUpdatedAt: entity.customLastUpdatedAt || entity.timestamp
        }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    } catch (error) {
      // Entity not found
      if ((error as any).statusCode === 404) {
        return {
          status: 404,
          body: JSON.stringify({ error: "Checklist not found." }),
          headers: {
            "Content-Type": "application/json"
          }
        };
      } else {
        throw error; // Re-throw if it's some other error
      }
    }
  } catch (error) {
    context.log(`Error retrieving checklist: ${error instanceof Error ? error.message : String(error)}`);
    return {
      status: 500,
      body: JSON.stringify({ error: "Failed to retrieve checklist." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};

app.http('getChecklist', {
  methods: ['GET'],
  route: 'checklist/{name}',
  authLevel: 'anonymous',
  handler: getChecklist
}); 