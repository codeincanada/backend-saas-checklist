import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

const setCompletion = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for setCompletion.");

  // Assume githubUserId is passed in a header or derived from an auth context
  // In a real scenario, you MUST validate this user's identity.
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
    };
  }

  if (!taskIdentifier || !completionData) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Please provide taskIdentifier and completionData in the request body." }),
    };
  }

  const entity = {
    PartitionKey: githubUserId,
    RowKey: taskIdentifier,
    CompletionData: JSON.stringify(completionData), // Serialize the completion data to a JSON string
    CustomLastUpdatedAt: new Date().toISOString(),
  };

  // Assign the entity to the output binding.
  // The Azure Functions runtime will handle writing this to Azure Table Storage.
  // This performs an "upsert" operation (create if not exists, or update if exists).
  context.extraOutputs.set('outputTable', entity);

  return {
    status: 200, // Or 201 if you want to distinguish between create and update
    body: JSON.stringify({ message: "Completion data saved successfully." }),
    headers: {
      "Content-Type": "application/json"
    }
  };
};

app.http('setCompletion', {
  methods: ['POST', 'PUT'],
  route: 'completion',
  authLevel: 'anonymous',
  extraOutputs: [{
    type: 'table',
    name: 'outputTable',
    tableName: 'UserTaskCompletions',
    connection: 'AzureWebJobsStorage'
  }],
  handler: setCompletion
}); 