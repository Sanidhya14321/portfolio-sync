let composioInstance: any = null;

async function getComposio(): Promise<any | null> {
  if (!process.env.COMPOSIO_API_KEY) {
    console.warn('[Composio] COMPOSIO_API_KEY not set');
    return null;
  }
  if (!composioInstance) {
    try {
      const { Composio } = await import('composio-core');
      composioInstance = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
    } catch (err) {
      console.warn('[Composio] Failed to load composio-core:', (err as any).message);
      return null;
    }
  }
  return composioInstance;
}

export async function getGitHubClient() {
  const composio = await getComposio();
  if (!composio) return null;
  try {
    const connected = await composio.connectedAccounts.list({ appName: 'github' });
    if (connected.length > 0) {
      return { app: 'github', connected: true, account: connected[0] };
    }
  } catch {
    // No connected GitHub account via Composio
  }
  return null;
}

export async function getLinkedInClient() {
  const composio = await getComposio();
  if (!composio) return null;
  try {
    const connected = await composio.connectedAccounts.list({ appName: 'linkedin' });
    if (connected.length > 0) {
      return { app: 'linkedin', connected: true, account: connected[0] };
    }
  } catch {
    // No connected LinkedIn account via Composio
  }
  return null;
}

export async function getTwitterClient() {
  const composio = await getComposio();
  if (!composio) return null;
  try {
    const connected = await composio.connectedAccounts.list({ appName: 'twitter' });
    if (connected.length > 0) {
      return { app: 'twitter', connected: true, account: connected[0] };
    }
  } catch {
    // No connected Twitter account via Composio
  }
  return null;
}

export async function getAllTools() {
  const composio = await getComposio();
  if (!composio) return [];

  try {
    const tools = await composio.tools.list({});
    return tools;
  } catch (err) {
    console.warn('[Composio] Failed to list tools:', (err as any).message);
    return [];
  }
}

export async function executeComposioAction(
  actionName: string,
  params: Record<string, any>
) {
  const composio = await getComposio();
  if (!composio) {
    throw new Error('Composio not initialized');
  }
  return composio.actions.execute({ actionName, params });
}
