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

const getChecklists = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for getChecklists.");

  // Get the authenticated user ID from header
  const userId = request.headers.get("x-github-user-id");

  if (!userId) {
    return {
      status: 401,
      body: JSON.stringify({ error: "Authentication required." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  try {
    const tableClient = getTableClient();
    
    // Query entities where PartitionKey equals the userId
    const entities = tableClient.listEntities<ChecklistEntity>({
      queryOptions: {
        filter: `PartitionKey eq '${userId}'`
      }
    });
    
    const checklists = [];
    for await (const entity of entities) {
      checklists.push({
        checklistName: entity.rowKey,
        // Deserialize the content from JSON string to an object
        content: JSON.parse(entity.content),
        lastUpdatedAt: entity.customLastUpdatedAt || entity.timestamp, // Prefer custom, fallback to system
      });
    }
    
    return {
      status: 200,
      body: JSON.stringify(checklists),
      headers: {
        "Content-Type": "application/json"
      }
    };
  } catch (error) {
    context.log(`Error retrieving checklists: ${error instanceof Error ? error.message : String(error)}`);
    return {
      status: 500,
      body: JSON.stringify({ error: "Failed to retrieve checklists." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};

app.http('getChecklists', {
  methods: ['GET'],
  route: 'checklists/user',
  authLevel: 'anonymous',
  handler: getChecklists
}); 