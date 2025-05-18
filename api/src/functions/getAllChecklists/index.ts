import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

// These should be configured in your Function App's settings
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const checklistsTableName = "Checklists";

// Initialize the Table client only when the function is called
function getTableClient() {
  const credential = new AzureNamedKeyCredential(storageAccountName!, storageAccountKey!);
  return new TableClient(
    `https://${storageAccountName}.table.core.windows.net`,
    checklistsTableName,
    credential
  );
}

// Interface to define the expected structure of checklist entities from Table Storage
interface ChecklistEntity {
  partitionKey: string; // Checklist category or "default"
  rowKey: string; // Checklist identifier
  title: string;
  description: string;
  items: string; // JSON string of checklist items
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const getAllChecklists = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for getAllChecklists.");

  // Get the authenticated user ID from header
  const authenticatedUserId = request.headers.get("x-github-user-id");

  // Authentication check
  if (!authenticatedUserId) {
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
    
    // Query all active checklists
    const entities = tableClient.listEntities<ChecklistEntity>({
      queryOptions: {
        filter: `isActive eq true`
      }
    });
    
    const checklists = [];
    for await (const entity of entities) {
      checklists.push({
        id: entity.rowKey,
        category: entity.partitionKey,
        title: entity.title,
        description: entity.description,
        items: JSON.parse(entity.items),
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      });
    }
    
    return {
      status: 200,
      body: JSON.stringify({ checklists }),
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

app.http('getAllChecklists', {
  methods: ['GET'],
  route: 'checklists',
  authLevel: 'anonymous',
  handler: getAllChecklists
}); 