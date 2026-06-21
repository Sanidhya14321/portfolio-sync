export interface Project {
  id: string;
  title: string;
  description?: string;
  tech_stack?: string;
  github_url?: string;
  is_from_github: boolean;
  linkedin_post?: string;
  twitter_update?: string;
  portfolio_description?: string;
  last_synced_to_linkedin?: string;
  last_synced_to_twitter?: string;
  last_synced_to_portfolio?: string;
  sync_status: 'pending' | 'syncing' | 'success' | 'failed';
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  project_id?: string;
  platform: 'linkedin' | 'twitter' | 'portfolio' | 'all';
  status: 'success' | 'failed' | 'pending';
  message: string;
  reasoning?: string;
  timestamp: string;
}

export interface AgentDecision {
  projectName: string;
  shouldShare: boolean;
  reason: string;
  linkedin?: { content: string; confidence: number };
  twitter?: { content: string; confidence: number };
  portfolio?: { content: string; confidence: number };
}
