import { AGENT_SYSTEM_PROMPT } from './agent-prompt';
import { executeTool } from './tool-executor';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

async function callOpenRouter(
  messages: ChatMessage[],
  tools?: any[]
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set. Please add it to your .env.local file.');
  }

  const body: any = {
    model: OPENROUTER_MODEL,
    messages,
    max_tokens: 4096,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Portfolio Sync Agent',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error('No response from OpenRouter');
  }

  const message = choice.message;
  const content = message?.content || '';
  const toolCalls = message?.tool_calls || [];

  return { content, toolCalls };
}

function buildToolDefinitions() {
  return [
    {
      type: 'function' as const,
      function: {
        name: 'GITHUB_GET_USER_REPOS',
        description: 'Get all GitHub repositories for a user',
        parameters: {
          type: 'object' as const,
          properties: {
            username: {
              type: 'string',
              description: 'GitHub username (defaults to GITHUB_USERNAME env var)',
            },
          },
          required: [],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'GITHUB_UPDATE_FILE',
        description: 'Update a file in a GitHub repository',
        parameters: {
          type: 'object' as const,
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path' },
            content: { type: 'string', description: 'New file content' },
            message: { type: 'string', description: 'Commit message' },
          },
          required: ['owner', 'repo', 'path', 'content', 'message'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'LINKEDIN_CREATE_LINKED_IN_POST',
        description: 'Create a post on LinkedIn',
        parameters: {
          type: 'object' as const,
          properties: {
            text: { type: 'string', description: 'Post content' },
          },
          required: ['text'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'TWITTER_CREATE_TWEET',
        description: 'Create a tweet on Twitter/X',
        parameters: {
          type: 'object' as const,
          properties: {
            text: { type: 'string', description: 'Tweet content' },
          },
          required: ['text'],
        },
      },
    },
  ];
}

export async function runAgentWorkflow(userPrompt: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  let finalResponse = '';
  const tools = buildToolDefinitions();

  for (let i = 0; i < 10; i++) {
    const { content, toolCalls } = await callOpenRouter(messages, tools);

    if (!toolCalls || toolCalls.length === 0) {
      finalResponse = content;
      break;
    }

    // Add assistant response with tool calls
    messages.push({
      role: 'assistant',
      content: content || '',
    });

    // Execute each tool call and collect results
    for (const tc of toolCalls) {
      console.log(`[Agent] Using tool: ${tc.function.name}`);
      let input: Record<string, any> = {};
      try {
        input = JSON.parse(tc.function.arguments);
      } catch {
        console.warn('[Agent] Failed to parse tool arguments');
      }
      console.log(`[Agent] Input:`, input);

      const result = await executeTool(tc.function.name, input);
      console.log(`[Agent] Result:`, result);

      messages.push({
        role: 'tool',
        content: JSON.stringify(result),
        tool_call_id: tc.id,
        name: tc.function.name,
      });
    }
  }

  return finalResponse;
}

export async function runAgentThinking(prompt: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  const { content } = await callOpenRouter(messages);
  return content;
}
