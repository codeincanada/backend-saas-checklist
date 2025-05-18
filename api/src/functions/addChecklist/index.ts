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

const addChecklist = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for addChecklist.");
  context.log(`Request Headers: ${JSON.stringify(Object.fromEntries(request.headers))}`);

  // Get the authenticated user ID from header
  const userId = request.headers.get("x-github-user-id");
  context.log(`User ID from header: ${userId}`);

  if (!userId) {
    context.log("Authentication required - missing x-github-user-id header");
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
    context.log(`Request to add checklist: ${checklistName} for user: ${userId}`);

    if (!checklistName) {
      context.log("Missing checklist name in request");
      return {
        status: 400,
        body: JSON.stringify({ error: "checklistName is required." }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    }

    if (!content) {
      context.log("Missing content in request");
      return {
        status: 400,
        body: JSON.stringify({ error: "content is required." }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    }

    const tableClient = getTableClient();
    context.log(`Checking if checklist "${checklistName}" already exists for user: ${userId}`);
    
    // Check if a checklist with the same name already exists for this user
    try {
      await tableClient.getEntity(userId, checklistName);
      // If successful, a checklist with this name already exists
      context.log(`Checklist "${checklistName}" already exists for user: ${userId}`);
      return {
        status: 409,
        body: JSON.stringify({ 
          error: "A checklist with this name already exists.",
          details: { userId, checklistName }
        }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    } catch (error) {
      // Entity not found - this is expected and allows us to continue
      if ((error as any).statusCode !== 404) {
        context.log(`Unexpected error checking for existing checklist: ${JSON.stringify(error)}`);
        throw error; // Re-throw if it's some other error
      }
      context.log(`Confirmed checklist "${checklistName}" does not exist for user: ${userId}`);
    }

    // Current timestamp in ISO format for lastUpdated
    const now = new Date().toISOString();
    context.log(`Creating new checklist "${checklistName}" for user: ${userId}`);

    // Store the checklist
    await tableClient.createEntity({
      partitionKey: userId,
      rowKey: checklistName,
      content: JSON.stringify(content),
      customLastUpdatedAt: now
    });
    context.log(`Successfully created checklist "${checklistName}" for user: ${userId}`);

    return {
      status: 201,
      body: JSON.stringify({ 
        message: "Checklist saved successfully.",
        checklistName: checklistName
      }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  } catch (error) {
    context.log(`Error saving checklist: ${error instanceof Error ? error.message : String(error)}`);
    return {
      status: 500,
      body: JSON.stringify({ error: "Failed to save checklist." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};

app.http('addChecklist', {
  methods: ['POST'],
  route: 'checklist',
  authLevel: 'anonymous',
  handler: addChecklist
}); 