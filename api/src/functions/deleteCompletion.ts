import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

// These should be configured in your Function App's settings
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const tableName = "UserTaskCompletions";

// Initialize the Table client only when the function is called (to avoid issues during cold start)
function getTableClient() {
  // Ensure you have AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY in application settings
  const credential = new AzureNamedKeyCredential(storageAccountName!, storageAccountKey!);
  return new TableClient(
    `https://${storageAccountName}.table.core.windows.net`,
    tableName,
    credential
  );
}

const deleteCompletion = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for deleteCompletion.");

  const url = new URL(request.url);
  const githubUserId = url.searchParams.get("githubUserId");
  const taskIdentifier = url.searchParams.get("taskIdentifier");

  if (!githubUserId || !taskIdentifier) {
    return {
      status: 400,
      body: JSON.stringify({
        error: "Please provide both githubUserId and taskIdentifier in query parameters."
      }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  try {
    const tableClient = getTableClient();
    await tableClient.deleteEntity(githubUserId, taskIdentifier);
    
    return {
      status: 200,
      body: JSON.stringify({ message: "Completion data deleted successfully." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  } catch (error: any) {
    if (error.statusCode === 404) {
      return {
        status: 404,
        body: JSON.stringify({ message: "Record not found." }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    } else {
      context.log(`Error deleting completion data: ${error.message}`);
      return {
        status: 500,
        body: JSON.stringify({ error: "Error deleting completion data." }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    }
  }
};

app.http('deleteCompletion', {
  methods: ['DELETE'],
  route: 'completion',
  authLevel: 'anonymous',
  handler: deleteCompletion
}); 