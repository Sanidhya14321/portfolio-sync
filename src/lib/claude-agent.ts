import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPT } from './agent-prompt';
import { executeTool } from './tool-executor';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
  tool_use_id?: string;
  content?: string;
}

export async function runAgentWorkflow(userPrompt: string): Promise<string> {
  const messages: Message[] = [
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  let finalResponse = '';

  // Agent loop - keep running until agent stops using tools
  for (let i = 0; i < 10; i++) {
    // Max 10 iterations to prevent infinite loops
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: AGENT_SYSTEM_PROMPT,
      messages: messages as any,
    });

    // Check if we have tool uses
    const hasToolUse = response.content.some((block) => block.type === 'tool_use');

    if (!hasToolUse || response.stop_reason === 'end_turn') {
      // No more tools to call - get final response
      finalResponse = response.content
        .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
      break;
    }

    // Add assistant response to messages
    messages.push({
      role: 'assistant',
      content: response.content as any,
    });

    // Process each tool use and collect results
    const toolResults: ContentBlock[] = [];

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        console.log(`[Agent] Using tool: ${block.name}`);
        console.log(`[Agent] Input:`, block.input);

        const result = await executeTool(block.name!, block.input || {});

        console.log(`[Agent] Result:`, result);

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Add tool results as user message
    if (toolResults.length > 0) {
      messages.push({
        role: 'user',
        content: toolResults as any,
      });
    }
  }

  return finalResponse;
}

// Simpler version without tool use (for MVP)
export async function runAgentThinking(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    system: AGENT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return response.content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}
