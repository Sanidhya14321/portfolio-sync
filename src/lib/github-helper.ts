import axios from 'axios';

interface GitHubRepo {
  name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  topics: string[];
  lastUpdated: string;
}

export async function fetchGitHubRepos(
  username: string = process.env.GITHUB_USERNAME || ''
): Promise<GitHubRepo[]> {
  if (!username) {
    console.warn('[GitHub] GITHUB_USERNAME not set, returning sample projects');
    return getMockRepos();
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get(
      `https://api.github.com/users/${username}/repos`,
      {
        headers,
        params: {
          sort: 'updated',
          per_page: 30,
        },
      }
    );

    return response.data.map((repo: any) => ({
      name: repo.name,
      description: repo.description || 'No description',
      url: repo.html_url,
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count,
      topics: repo.topics || [],
      lastUpdated: repo.updated_at,
    }));
  } catch (error: any) {
    console.error('[GitHub] Error fetching repos:', error.response?.data?.message || error.message);
    console.warn('[GitHub] Returning mock data due to API error');
    return getMockRepos();
  }
}

function getMockRepos(): GitHubRepo[] {
  return [
    {
      name: 'portfolio-sync',
      description: 'AI-powered portfolio sync agent',
      url: 'https://github.com/Sanidhya14321/portfolio-sync',
      language: 'TypeScript',
      stars: 12,
      topics: ['nextjs', 'ai', 'portfolio'],
      lastUpdated: new Date().toISOString(),
    },
    {
      name: 'awesome-project',
      description: 'An awesome open-source project',
      url: 'https://github.com/Sanidhya14321/awesome-project',
      language: 'Python',
      stars: 45,
      topics: ['python', 'ml', 'open-source'],
      lastUpdated: new Date().toISOString(),
    },
  ];
}

export async function getFileFromGitHub(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3.raw',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('[GitHub] Error fetching file:', error);
    throw new Error(`Failed to fetch ${path} from GitHub`);
  }
}

export async function updateFileOnGitHub(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string
): Promise<{ success: boolean; sha: string; error?: string }> {
  if (!process.env.GITHUB_TOKEN) {
    return {
      success: false,
      sha: '',
      error: 'GITHUB_TOKEN not set. Cannot update files on GitHub.',
    };
  }

  try {
    const currentFile = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    const response = await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        message,
        content: Buffer.from(content).toString('base64'),
        sha: currentFile.data.sha,
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      sha: response.data.commit.sha,
    };
  } catch (error: any) {
    console.error('[GitHub] Error updating file:', error);
    return {
      success: false,
      sha: '',
      error: error.response?.data?.message || 'Failed to update file',
    };
  }
}
