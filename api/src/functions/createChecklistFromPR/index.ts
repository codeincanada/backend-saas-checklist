import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";
import fetch from 'node-fetch';

// These should be configured in your Function App's settings
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const tableName = "Checklists";

// Initialize the Table client
function getTableClient() {
  const credential = new AzureNamedKeyCredential(storageAccountName!, storageAccountKey!);
  return new TableClient(
    `https://${storageAccountName}.table.core.windows.net`,
    tableName,
    credential
  );
}

interface PRRequestBody {
  prUrl: string;
}

interface GitHubPRData {
  title: string;
  body: string;
  number: number;
  state: string;
  user: {
    login: string;
  };
  head: {
    sha: string;
  };
  base: {
    sha: string;
  };
}

interface GitHubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

// Function to extract PR details from URL
function parsePRUrl(prUrl: string): { owner: string; repo: string; prNumber: string } | null {
  const match = prUrl.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)$/);
  if (!match) return null;
  
  return {
    owner: match[1],
    repo: match[2],
    prNumber: match[3]
  };
}

// Function to analyze PR content and generate checklist items
function generateChecklistFromPR(prData: GitHubPRData, files: GitHubFile[], commits: GitHubCommit[]): any {
  const sections: any = {};
  
  // Initialize all sections
  const sectionIds = ['code-standards', 'testing', 'documentation', 'deployment', 'security', 'performance'];
  sectionIds.forEach(id => {
    sections[id] = { items: {} };
  });

  // Analyze files for code standards
  const hasTypeScriptFiles = files.some(f => f.filename.endsWith('.ts') || f.filename.endsWith('.tsx'));
  const hasJavaScriptFiles = files.some(f => f.filename.endsWith('.js') || f.filename.endsWith('.jsx'));
  const hasStyleFiles = files.some(f => f.filename.endsWith('.css') || f.filename.endsWith('.scss') || f.filename.endsWith('.sass'));
  const hasConfigFiles = files.some(f => f.filename.includes('config') || f.filename.endsWith('.json'));
  
  if (hasTypeScriptFiles || hasJavaScriptFiles) {
    sections['code-standards'].items['code-review'] = false;
    sections['code-standards'].items['naming-conventions'] = false;
    sections['code-standards'].items['error-handling'] = false;
  }

  // Analyze for testing needs
  const hasTestFiles = files.some(f => f.filename.includes('test') || f.filename.includes('spec'));
  const hasLargeChanges = files.some(f => f.changes > 50);
  
  if (hasTestFiles || hasLargeChanges) {
    sections['testing'].items['unit-tests'] = false;
    sections['testing'].items['integration-tests'] = false;
  }

  // Check for documentation needs
  const hasReadmeChanges = files.some(f => f.filename.toLowerCase().includes('readme'));
  const hasAPIChanges = files.some(f => f.filename.includes('api') || f.filename.includes('endpoint'));
  
  if (hasReadmeChanges || hasAPIChanges || prData.body?.length > 100) {
    sections['documentation'].items['api-docs'] = false;
    sections['documentation'].items['readme-updated'] = false;
  }

  // Check for deployment considerations
  if (hasConfigFiles || files.some(f => f.filename.includes('deploy') || f.filename.includes('docker'))) {
    sections['deployment'].items['staging-tested'] = false;
    sections['deployment'].items['rollback-plan'] = false;
  }

  // Security considerations
  const hasAuthChanges = files.some(f => f.filename.includes('auth') || f.filename.includes('security'));
  const hasDependencyChanges = files.some(f => f.filename.includes('package.json') || f.filename.includes('requirements'));
  
  if (hasAuthChanges || hasDependencyChanges) {
    sections['security'].items['security-review'] = false;
    sections['security'].items['dependency-check'] = false;
  }

  // Performance considerations
  if (hasLargeChanges || files.length > 10) {
    sections['performance'].items['performance-tested'] = false;
    sections['performance'].items['memory-usage'] = false;
  }

  return sections;
}

const createChecklistFromPR = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("HTTP trigger function processed a request for createChecklistFromPR.");

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
    const requestBody = await request.json() as PRRequestBody;
    const { prUrl } = requestBody;

    if (!prUrl) {
      return {
        status: 400,
        body: JSON.stringify({ error: "prUrl is required." }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    }

    // Parse PR URL
    const prDetails = parsePRUrl(prUrl);
    if (!prDetails) {
      return {
        status: 400,
        body: JSON.stringify({ error: "Invalid GitHub PR URL format." }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    }

    const { owner, repo, prNumber } = prDetails;

    // Fetch PR data from GitHub API
    const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`);
    if (!prResponse.ok) {
      return {
        status: 400,
        body: JSON.stringify({ error: "Failed to fetch PR data from GitHub. Please check the URL and ensure the repository is public." }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    }

    const prData: GitHubPRData = await prResponse.json() as GitHubPRData;

    // Fetch PR files
    const filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`);
    const files: GitHubFile[] = filesResponse.ok ? await filesResponse.json() as GitHubFile[] : [];

    // Fetch PR commits
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/commits`);
    const commits: GitHubCommit[] = commitsResponse.ok ? await commitsResponse.json() as GitHubCommit[] : [];

    // Generate checklist name
    const checklistName = `PR-${prNumber}-${repo}`;

    // Check if checklist already exists
    const tableClient = getTableClient();
    try {
      await tableClient.getEntity(userId, checklistName);
      return {
        status: 409,
        body: JSON.stringify({ 
          error: "A checklist for this PR already exists.",
          checklistName 
        }),
        headers: {
          "Content-Type": "application/json"
        }
      };
    } catch (error) {
      // Entity not found - this is expected and allows us to continue
      if ((error as any).statusCode !== 404) {
        throw error;
      }
    }

    // Generate checklist content
    const sections = generateChecklistFromPR(prData, files, commits);
    const content = {
      sections,
      lastUpdatedAt: new Date().toISOString(),
      prUrl,
      prTitle: prData.title,
      prNumber: prData.number,
      repository: `${owner}/${repo}`
    };

    // Store the checklist
    await tableClient.createEntity({
      partitionKey: userId,
      rowKey: checklistName,
      content: JSON.stringify(content),
      customLastUpdatedAt: new Date().toISOString()
    });

    return {
      status: 201,
      body: JSON.stringify({ 
        message: "Checklist created successfully from PR.",
        checklistName,
        content
      }),
      headers: {
        "Content-Type": "application/json"
      }
    };

  } catch (error) {
    context.log(`Error creating checklist from PR: ${error instanceof Error ? error.message : String(error)}`);
    return {
      status: 500,
      body: JSON.stringify({ error: "Failed to create checklist from PR." }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};

app.http('createChecklistFromPR', {
  methods: ['POST'],
  route: 'checklist/from-pr',
  authLevel: 'anonymous',
  handler: createChecklistFromPR
}); 