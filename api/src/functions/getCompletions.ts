import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// Interface to define the expected structure of entities from Table Storage
interface CompletionEntity {
  PartitionKey: string; // githubUserId
  RowKey: string; // taskIdentifier
  CompletionData: string; // JSON string
  CustomLastUpdatedAt: string;
  Timestamp: string; // Auto-added by Azure Tables
}

const getCompletions = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for getCompletions.");

  const url = new URL(request.url);
  const githubUserId = url.searchParams.get("githubUserId");

  if (!githubUserId) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Please provide githubUserId as a query parameter." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  // Get the completions from the input binding
  const completions = context.extraInputs.get('completions') as CompletionEntity[] || [];

  if (completions.length > 0) {
    const result = completions.map((entity) => ({
      taskIdentifier: entity.RowKey,
      // Deserialize the CompletionData from JSON string to an object
      completionData: JSON.parse(entity.CompletionData),
      lastUpdatedAt: entity.CustomLastUpdatedAt || entity.Timestamp, // Prefer custom, fallback to system
    }));
    
    return {
      status: 200,
      body: JSON.stringify(result),
      headers: {
        "Content-Type": "application/json"
      }
    };
  } else {
    // No error, just no completions found for this user
    return {
      status: 200,
      body: JSON.stringify([]),
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
  extraInputs: [{
    type: 'table',
    name: 'completions',
    tableName: 'UserTaskCompletions',
    partitionKey: '{Query.githubUserId}',
    connection: 'AzureWebJobsStorage'
  }],
  handler: getCompletions
}); 