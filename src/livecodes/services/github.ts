import type { User } from '../models';

export interface GitHubFile {
  path: string;
  content: string;
}

export const getGithubHeaders = (user: User) => ({
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
  Authorization: 'token ' + user.token,
});

export const repoExists = async (user: User, repo: string) => {
  try {
    const res = await fetch(`https://api.github.com/repos/${user.username}/${repo}`, {
      method: 'GET',
      headers: getGithubHeaders(user),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const createRepo = async (user: User, repo: string, description?: string) => {
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: getGithubHeaders(user),
    body: JSON.stringify({
      name: repo,
      private: false,
      homepage: `https://${user.username}.github.io/${repo}/`,
      ...(description ? { description } : {}),
    }),
  });
  if (!res.ok) {
    const error = await res.json().then((data) => data.errors[0]?.message);
    if (error === 'name already exists on this account') {
      throw new Error('Repo name already exists');
    }
    throw new Error('Error creating repo');
  }
  return res.json().then((data) => data.name);
};

export const createFile = async ({
  user,
  repo,
  branch,
  file,
  message,
  initialize = false,
  encoded = false,
}: {
  user: User;
  repo: string;
  branch: string;
  file: GitHubFile;
  message: string;
  initialize: boolean;
  encoded: boolean;
}) => {
  const url = `https://api.github.com/repos/${user.username}/${repo}/contents/`;

  let sha: string | undefined;

  if (!initialize) {
    const response = await fetch(url, {
      method: 'GET',
      headers: getGithubHeaders(user),
    });
    if (response.ok) {
      const files = await response.json();
      sha = files.find((f: any) => f.path === file.path)?.sha;
    }
  }

  const res = await fetch(url + file.path, {
    method: 'PUT',
    headers: getGithubHeaders(user),
    body: JSON.stringify({
      message: message || 'deploy',
      content: encoded ? file.content : btoa(file.content),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error('Error creating file');
  }
  return res.json();
};

export const initializeRepo = async (
  user: User,
  repo: string,
  branch = 'main',
  readmeContent?: string,
) =>
  (
    await createFile({
      user,
      repo,
      branch,
      file: { path: 'readme.md', content: `${readmeContent || '# ' + repo + '\n'}` },
      message: 'initial commit',
      initialize: true,
      encoded: false,
    })
  )?.commit.sha;

export const getLastCommit = async (user: User, repo: string, branch: string) => {
  const res = await fetch(
    `https://api.github.com/repos/${user.username}/${repo}/git/matching-refs/heads/${branch}?per_page=100`,
    {
      method: 'GET',
      headers: getGithubHeaders(user),
    },
  );
  const refs = await res.json();

  if (refs.message === 'Git Repository is empty.') {
    const commit = await initializeRepo(user, repo, 'main');
    return branch === 'main' ? commit : null;
  }

  if (!res.ok) {
    throw new Error('Error getting last commit');
  }

  const branchRef = refs.find((ref: any) => ref.ref === `refs/heads/${branch}`);

  if (!branchRef) return null;
  return branchRef.object.sha;
};

export const createTree = async (
  user: User,
  repo: string,
  files: GitHubFile[],
): Promise<string> => {
  const tree = files.map((file) => ({
    path: file.path,
    mode: '100644',
    type: 'blob',
    content: file.content,
  }));

  const res = await fetch(`https://api.github.com/repos/${user.username}/${repo}/git/trees`, {
    method: 'POST',
    headers: getGithubHeaders(user),
    body: JSON.stringify({ tree }),
  });
  if (!res.ok) {
    throw new Error('Error creating tree');
  }
  return res.json().then((data) => data.sha);
};

export const createCommit = async (
  user: User,
  repo: string,
  message: string,
  tree: string,
  lastCommit: string | null,
): Promise<string> => {
  const res = await fetch(`https://api.github.com/repos/${user.username}/${repo}/git/commits`, {
    method: 'POST',
    headers: getGithubHeaders(user),
    body: JSON.stringify({
      tree,
      message: message || 'deploy',
      ...(lastCommit ? { parents: [lastCommit] } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error('Error creating commit');
  }
  return res.json().then((data) => data.sha);
};

export const createBranch = async (user: User, repo: string, branch: string, commit: string) => {
  const res = await fetch(`https://api.github.com/repos/${user.username}/${repo}/git/refs`, {
    method: 'POST',
    headers: getGithubHeaders(user),
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha: commit,
    }),
  });
  if (!res.ok) {
    throw new Error('Error creating branch');
  }
  return true;
};

export const updateBranch = async (user: User, repo: string, branch: string, commit: string) => {
  const res = await fetch(
    `https://api.github.com/repos/${user.username}/${repo}/git/refs/heads/${branch}`,
    {
      method: 'PATCH',
      headers: getGithubHeaders(user),
      body: JSON.stringify({
        sha: commit,
      }),
    },
  );
  if (!res.ok) {
    throw new Error('Error updating branch');
  }
  return true;
};

export const getUserPublicRepos = async (user: User) => {
  let page = 1;
  const pageSize = 100;
  const maxPages = 5;
  const results = [];

  while (page <= maxPages) {
    const response = await fetch(
      `https://api.github.com/user/repos?type=public&per_page=${pageSize}&page=${page}`,
      {
        method: 'GET',
        headers: getGithubHeaders(user),
      },
    );
    page += 1;
    if (!response.ok) {
      continue;
    }
    const newResults = await response.json();
    results.push(...newResults.map((repo: any) => repo.name));
    if (newResults.length < pageSize) {
      page = maxPages + 1;
    }
  }
  return results;
};
