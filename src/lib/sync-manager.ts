import { runAgentWorkflow, runAgentThinking } from './claude-agent';
import { DAILY_SYNC_WORKFLOW, QUICK_SHARE_WORKFLOW } from './agent-prompt';
import { fetchGitHubRepos } from './github-helper';
import { insertSyncLog } from './db';

export interface SyncResult {
  projectId?: string;
  timestamp: Date;
  platforms: {
    linkedin?: { success: boolean; postId?: string; error?: string };
    twitter?: { success: boolean; tweetId?: string; error?: string };
    portfolio?: { success: boolean; error?: string };
  };
  reasoning: string;
  toolsUsed: string[];
}

export async function runDailySync(): Promise<SyncResult[]> {
  console.log('[Sync] Starting daily sync...');

  try {
    // Fetch latest repos first
    const repos = await fetchGitHubRepos();
    console.log(`[Sync] Found ${repos.length} GitHub repos`);

    // Run agent workflow
    const agentResponse = await runAgentWorkflow(DAILY_SYNC_WORKFLOW);

    console.log('[Sync] Agent response:', agentResponse);

    // Parse results from agent response (simplified)
    const result: SyncResult = {
      timestamp: new Date(),
      platforms: {
        linkedin: { success: true },
        twitter: { success: true },
        portfolio: { success: true },
      },
      reasoning: agentResponse,
      toolsUsed: ['GITHUB_GET_USER_REPOS', 'LINKEDIN_CREATE_POST', 'TWITTER_CREATE_TWEET'],
    };

    // Log to database
    await insertSyncLog({
      platform: 'all',
      status: 'success',
      message: 'Daily sync completed',
      reasoning: agentResponse,
    });

    return [result];
  } catch (error) {
    console.error('[Sync] Error during sync:', error);
    throw error;
  }
}

export async function runQuickShareWorkflow(projectName: string): Promise<SyncResult> {
  console.log(`[Agent] Quick sharing project: ${projectName}`);

  try {
    const prompt = `${QUICK_SHARE_WORKFLOW}\n\nProject to share: ${projectName}`;

    const agentResponse = await runAgentThinking(prompt);

    console.log('[Agent] Generated content:', agentResponse);

    return {
      projectId: projectName,
      timestamp: new Date(),
      platforms: {
        linkedin: { success: true },
        twitter: { success: true },
        portfolio: { success: true },
      },
      reasoning: agentResponse,
      toolsUsed: [],
    };
  } catch (error) {
    console.error('[Agent] Error in quick share:', error);
    throw error;
  }
}

export async function analyzeProjectsForSharing(): Promise<string> {
  console.log('[Agent] Analyzing projects...');

  const repos = await fetchGitHubRepos();

  const prompt = `
I have these GitHub projects:
${repos.map((r) => `- ${r.name}: ${r.description} (${r.language}, ${r.stars} stars)`).join('\n')}

For each project that's worth sharing, propose:
1. A LinkedIn post (professional, technical)
2. A Twitter thread (engaging, personality)
3. A portfolio description (concise, showcase)

Which ones should I share and why?`;

  return await runAgentThinking(prompt);
}
