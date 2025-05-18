import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient, AzureNamedKeyCredential, TableEntity } from "@azure/data-tables";

// These should be configured in your Function App\'s settings
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const tableName = "Checklists"; // Assuming the same table as updateChecklist

// Initialize the Table client
function getTableClient() {
  if (!storageAccountName || !storageAccountKey) {
    throw new Error("Azure Storage account name and key must be configured in environment variables.");
  }
  const credential = new AzureNamedKeyCredential(storageAccountName, storageAccountKey);
  return new TableClient(
    `https://${storageAccountName}.table.core.windows.net`,
    tableName,
    credential
  );
}

interface ChecklistContent {
  sections: Record<string, {
    items: Record<string, boolean>;
  }>;
  lastUpdatedAt: string;
}

interface SetChecklistItemStatusRequestBody {
  checklistName: string;
  sectionId: string;
  itemId: string;
  isChecked: boolean;
}

// Define a type for the entity stored in Azure Table
// It includes the partitionKey, rowKey, and the content string, plus a timestamp
interface ChecklistTableEntity extends TableEntity<ChecklistContent> {
  content: string; // JSON string of ChecklistContent
  customLastUpdatedAt?: string; // Matches the field used in updateChecklist
}


const setChecklistItemStatus = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for setChecklistItemStatus.");

  const userId = request.headers.get("x-github-user-id");
  if (!userId) {
    return {
      status: 401,
      body: JSON.stringify({ error: "Authentication required. User ID missing from headers." }),
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    const requestBody = await request.json() as SetChecklistItemStatusRequestBody;
    const { checklistName, sectionId, itemId, isChecked } = requestBody;

    if (!checklistName || !sectionId || !itemId || typeof isChecked !== \'boolean\') {
      return {
        status: 400,
        body: JSON.stringify({ error: "Missing required fields: checklistName, sectionId, itemId, isChecked." }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const tableClient = getTableClient();
    let existingEntity: ChecklistTableEntity;

    try {
      // Azure Table SDK getEntity returns an error if not found, so we cast to the expected type.
      // The SDK might return a slightly different shape, so we ensure \'content\' is what we expect.
      const result = await tableClient.getEntity<Pick<ChecklistTableEntity, \'partitionKey\' | \'rowKey\' | \'content\' | \'customLastUpdatedAt\'>>(userId, checklistName);
      existingEntity = result as ChecklistTableEntity; // Cast after successful retrieval
      if (typeof existingEntity.content !== \'string\') {
         context.log(`Warning: content for ${checklistName} is not a string or is missing. Found:`, existingEntity.content);
         // Initialize default content structure if it\'s entirely missing or wrong type
         // This case should ideally not happen if checklists are created correctly.
         existingEntity.content = JSON.stringify({ sections: {}, lastUpdatedAt: new Date().toISOString() });
      }
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          status: 404,
          body: JSON.stringify({ error: `Checklist \'${checklistName}\' not found for user.` }),
          headers: { "Content-Type": "application/json" },
        };
      }
      context.log(`Error fetching entity: ${error.message}`);
      throw error;
    }

    let checklistContent: ChecklistContent;
    try {
        checklistContent = JSON.parse(existingEntity.content);
    } catch (parseError) {
        context.log(`Error parsing checklist content for ${checklistName}: ${parseError.message}. Content was:`, existingEntity.content);
        return {
            status: 500,
            body: JSON.stringify({ error: "Failed to parse existing checklist data." }),
            headers: { "Content-Type": "application/json" },
        };
    }


    // Ensure sections and items objects exist
    if (!checklistContent.sections) {
      checklistContent.sections = {};
    }
    if (!checklistContent.sections[sectionId]) {
      checklistContent.sections[sectionId] = { items: {} };
    }
    if (!checklistContent.sections[sectionId].items) {
      checklistContent.sections[sectionId].items = {};
    }

    checklistContent.sections[sectionId].items[itemId] = isChecked;
    const now = new Date().toISOString();
    checklistContent.lastUpdatedAt = now;

    const updatedEntity: ChecklistTableEntity = {
      partitionKey: userId,
      rowKey: checklistName,
      content: JSON.stringify(checklistContent),
      customLastUpdatedAt: now, // Mirroring the field used in updateChecklist
    };

    await tableClient.updateEntity(updatedEntity, "Replace"); // "Replace" to overwrite

    return {
      status: 200,
      body: JSON.stringify({ message: "Checklist item status updated successfully." }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error: any) {
    context.log(`Error in setChecklistItemStatus: ${error.message}`);
    if (error instanceof SyntaxError) { // JSON parsing error from request body
        return { status: 400, body: JSON.stringify({ error: "Invalid JSON in request body."}), headers: { "Content-Type": "application/json"}};
    }
    return {
      status: 500,
      body: JSON.stringify({ error: "Failed to update checklist item status." }),
      headers: { "Content-Type": "application/json" },
    };
  }
};

app.http(\'setChecklistItemStatus\', {
  methods: [\'POST\', \'PUT\'], // Using POST as it creates/updates a sub-resource status
  route: \'checklist/item-status\', // New route
  authLevel: \'anonymous\', // Assuming similar auth handling as updateChecklist
  handler: setChecklistItemStatus
}); 