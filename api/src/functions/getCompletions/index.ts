import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

// These should be configured in your Function App's settings
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const tableName = "UserTaskCompletions";

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
interface CompletionEntity {
  partitionKey: string; // githubUserId
  rowKey: string; // taskIdentifier
  completionData: string; // JSON string
  customLastUpdatedAt: string;
  timestamp: string; // Auto-added by Azure Tables
}

const getCompletions = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for getCompletions.");

  const url = new URL(request.url);
  const githubUserId = url.searchParams.get("githubUserId");
  // Get the authenticated user ID from header
  const authenticatedUserId = request.headers.get("x-github-user-id");

  if (!githubUserId) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Please provide githubUserId as a query parameter." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  // Ensure users can only access their own data
  if (!authenticatedUserId || authenticatedUserId !== githubUserId) {
    return {
      status: 403,
      body: JSON.stringify({ error: "You can only access your own checklists." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  try {
    const tableClient = getTableClient();
    
    // Query entities where PartitionKey equals the githubUserId
    const entities = tableClient.listEntities<CompletionEntity>({
      queryOptions: {
        filter: `PartitionKey eq '${githubUserId}'`
      }
    });
    
    const completions = [];
    for await (const entity of entities) {
      completions.push({
        taskIdentifier: entity.rowKey,
        // Deserialize the CompletionData from JSON string to an object
        completionData: JSON.parse(entity.completionData),
        lastUpdatedAt: entity.customLastUpdatedAt || entity.timestamp, // Prefer custom, fallback to system
      });
    }
    
    return {
      status: 200,
      body: JSON.stringify(completions),
      headers: {
        "Content-Type": "application/json"
      }
    };
  } catch (error) {
    context.log(`Error retrieving completions: ${error instanceof Error ? error.message : String(error)}`);
    return {
      status: 500,
      body: JSON.stringify({ error: "Failed to retrieve completion data." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};

app.http('getCompletions', {
  methods: ['GET'],
  route: 'completions',
  authLevel: 'anonymous',
  handler: getCompletions
}); 