import axios from 'axios';

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

let composioTools: Record<string, any> | null = null;

async function getComposioTools(): Promise<Record<string, any> | null> {
  if (composioTools) return composioTools;
  if (!process.env.COMPOSIO_API_KEY) return null;

  try {
    // Composio tool listing via their API
    const { data } = await axios.get('https://backend.composio.dev/api/v1/tools', {
      headers: { 'x-api-key': process.env.COMPOSIO_API_KEY },
    });
    composioTools = data;
    return composioTools;
  } catch (err) {
    console.warn('[Composio] Failed to fetch tools:', (err as any).message);
    return null;
  }
}

export async function executeTool(
  toolName: string,
  input: Record<string, any>
): Promise<ToolResult> {
  try {
    // Try Composio first if API key is available
    const composio = await getComposioTools();
    if (composio && process.env.COMPOSIO_API_KEY) {
      try {
        const { data } = await axios.post(
          'https://backend.composio.dev/api/v1/actions/execute',
          {
            action: toolName,
            params: input,
          },
          {
            headers: { 'x-api-key': process.env.COMPOSIO_API_KEY },
            timeout: 15000,
          }
        );
        return { success: true, data };
      } catch (composioErr: any) {
        // If Composio fails, fall through to mock mode
        console.warn(`[Composio] ${toolName} failed: ${composioErr.message}. Falling back to mock.`);
      }
    }

    // Route to mock implementations
    if (toolName.startsWith('GITHUB_')) {
      return await executeGitHubTool(toolName, input);
    } else if (toolName.startsWith('LINKEDIN_')) {
      return await executeLinkedInTool(toolName, input);
    } else if (toolName.startsWith('TWITTER_')) {
      return await executeTwitterTool(toolName, input);
    }

    return { success: false, error: `Unknown tool: ${toolName}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function executeGitHubTool(
  toolName: string,
  input: Record<string, any>
): Promise<ToolResult> {
  switch (toolName) {
    case 'GITHUB_GET_USER_REPOS':
      return { success: true, data: [] };
    case 'GITHUB_UPDATE_FILE':
      return { success: true, data: { sha: 'mock-sha' } };
    default:
      return { success: false, error: `GitHub tool ${toolName} not implemented` };
  }
}

async function executeLinkedInTool(
  toolName: string,
  input: Record<string, any>
): Promise<ToolResult> {
  console.log('[MOCK] LinkedIn:', toolName, input);
  return { success: true, data: { mock: true, message: 'LinkedIn mock mode' } };
}

async function executeTwitterTool(
  toolName: string,
  input: Record<string, any>
): Promise<ToolResult> {
  console.log('[MOCK] Twitter:', toolName, input);
  return { success: true, data: { mock: true, message: 'Twitter mock mode' } };
}
