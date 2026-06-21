// Composio client wrapper
// Note: The composio-core package may not expose the exact API shown in the guide.
// This is a simplified wrapper that delegates to direct API calls via tool-executor.ts.

export async function getGitHubClient() {
  if (!process.env.GITHUB_TOKEN) {
    console.warn('GitHub token not configured');
    return null;
  }
  return { app: 'github', connected: true };
}

export async function getLinkedInClient() {
  if (!process.env.LINKEDIN_ACCESS_TOKEN) {
    console.warn('LinkedIn token not configured - using mock mode');
    return null;
  }
  return { app: 'linkedin', connected: true };
}

export async function getTwitterClient() {
  if (!process.env.TWITTER_API_KEY) {
    console.warn('Twitter credentials not configured - using mock mode');
    return null;
  }
  return { app: 'twitter', connected: true };
}

export async function getAllTools() {
  const github = await getGitHubClient();
  const linkedin = await getLinkedInClient();
  const twitter = await getTwitterClient();

  const tools = [];

  if (github) {
    tools.push(
      ...[
        'GITHUB_GET_USER',
        'GITHUB_GET_USER_REPOS',
        'GITHUB_GET_FILE',
        'GITHUB_UPDATE_FILE',
      ].map((name) => ({
        app: 'github',
        name,
        client: github,
      }))
    );
  }

  if (linkedin) {
    tools.push(
      ...[
        'LINKEDIN_GET_MY_INFO',
        'LINKEDIN_CREATE_LINKED_IN_POST',
        'LINKEDIN_CREATE_ARTICLE_OR_URL_SHARE',
        'LINKEDIN_GET_SHARE_STATS',
      ].map((name) => ({
        app: 'linkedin',
        name,
        client: linkedin,
      }))
    );
  }

  if (twitter) {
    tools.push(
      ...[
        'TWITTER_GET_AUTHENTICATED_USER',
        'TWITTER_CREATE_TWEET',
        'TWITTER_GET_RECENT_TWEETS',
      ].map((name) => ({
        app: 'twitter',
        name,
        client: twitter,
      }))
    );
  }

  return tools;
}
