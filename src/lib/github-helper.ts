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
  try {
    const response = await axios.get(
      `https://api.github.com/users/${username}/repos`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
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
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    throw new Error('Failed to fetch GitHub repos');
  }
}

export async function getFileFromGitHub(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching file from GitHub:', error);
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
  try {
    // Get current file SHA (needed for update)
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
    console.error('Error updating file on GitHub:', error);
    return {
      success: false,
      sha: '',
      error: error.response?.data?.message || 'Failed to update file',
    };
  }
}
