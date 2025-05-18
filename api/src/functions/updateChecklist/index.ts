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

// Define types for our request body
interface ChecklistRequestBody {
  checklistName: string;
  content: {
    sections: Array<{
      title: string;
      items: Array<{
        text: string;
        isCompleted: boolean;
      }>;
    }>;
    lastUpdated?: string;
  };
}

const updateChecklist = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for updateChecklist.");

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
    // Parse the request body
    const requestBody = await request.json() as ChecklistRequestBody;
    const { checklistName, content } = requestBody;

    if (!checklistName) {
      return {
        status: 400,
        body: JSON.stringify({ error: "checklistName is required." }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    }

    if (!content) {
      return {
        status: 400,
        body: JSON.stringify({ error: "content is required." }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    }

    const tableClient = getTableClient();
    
    // Check if the checklist exists
    try {
      await tableClient.getEntity(userId, checklistName);
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

    // Current timestamp in ISO format for lastUpdated
    const now = new Date().toISOString();

    // Update the checklist
    await tableClient.updateEntity({
      partitionKey: userId,
      rowKey: checklistName,
      content: JSON.stringify(content),
      customLastUpdatedAt: now
    }, "Merge");

    return {
      status: 200,
      body: JSON.stringify({ 
        message: "Checklist updated successfully.",
        checklistName: checklistName
      }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  } catch (error) {
    context.log(`Error updating checklist: ${error instanceof Error ? error.message : String(error)}`);
    return {
      status: 500,
      body: JSON.stringify({ error: "Failed to update checklist." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};

app.http('updateChecklist', {
  methods: ['PUT'],
  route: 'checklist',
  authLevel: 'anonymous',
  handler: updateChecklist
}); 