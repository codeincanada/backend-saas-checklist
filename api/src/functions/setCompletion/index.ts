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

const setCompletion = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for setCompletion.");

  // Get the GitHub user ID from header
  const githubUserId = request.headers.get("x-github-user-id");
  
  // Parse request body
  const body = await request.json();
  const { taskIdentifier, completionData } = body as {
    taskIdentifier?: string;
    completionData?: any;
  };

  if (!githubUserId) {
    return {
      status: 401,
      body: JSON.stringify({ error: "User not authenticated or githubUserId not provided." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  if (!taskIdentifier || !completionData) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Please provide taskIdentifier and completionData in the request body." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  try {
    const entity = {
      partitionKey: githubUserId,
      rowKey: taskIdentifier,
      completionData: JSON.stringify(completionData),
      customLastUpdatedAt: new Date().toISOString(),
    };

    // Use TableClient to directly insert the entity
    const tableClient = getTableClient();
    await tableClient.upsertEntity(entity, "Replace");

    return {
      status: 200,
      body: JSON.stringify({ message: "Completion data saved successfully." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  } catch (error) {
    context.log(`Error saving completion: ${error instanceof Error ? error.message : String(error)}`);
    return {
      status: 500,
      body: JSON.stringify({ error: "Failed to save completion data. " + (error instanceof Error ? error.message : String(error)) }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};

app.http('setCompletion', {
  methods: ['POST', 'PUT'],
  route: 'completion',
  authLevel: 'anonymous',
  handler: setCompletion
}); 