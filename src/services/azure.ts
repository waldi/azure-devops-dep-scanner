const TOKEN = process.env.AZURE_PERSONAL_ACCESS_TOKEN;
const authorizedRequest = async (url, options = {}, json = true) => {
  const encodedToken = Buffer.from(`:${TOKEN}`).toString("base64");

  const headers = new Headers();
  headers.append("Authorization", `Basic ${encodedToken}`);

  const result = await fetch(url, {
    method: "GET",
    headers,
    redirect: "follow",
    ...options,
  });

  if (!result.ok) {
    console.error("Failed to fetch: ", url, result.status, result.statusText, await result.text());
    throw new Error("Failed to fetch");
  }

  if (!json) {
    return result.text();
  }

  return result.json();
};

export const getProfile = async () => {
  return authorizedRequest(
    "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=5.1"
  );
};

export const getOrganisations = async (userId) => {
  console.log("Fetching organisations...");
  return authorizedRequest(
    `https://app.vssps.visualstudio.com/_apis/accounts?api-version=5.1&memberId=${userId}`
  );
};

export const getProjects = async (organisation) => {
  console.log(`  Fetching projects for ${organisation.accountName}...`);
  return authorizedRequest(
    `https://dev.azure.com/${organisation.accountName}/_apis/projects?api-version=7.1-preview.4`
  );
};

export const getRepositories = async (organisation, project) => {
  console.log(`    Fetching repositories for ${organisation.accountName}/${project.name}...`);
  return authorizedRequest(
    `https://dev.azure.com/${organisation.accountName}/${project.name}/_apis/git/repositories?api-version=7.1-preview.1`
  );
};

export const getItems = async (organisation, project, repositoryId) => {
  return authorizedRequest(
    `https://dev.azure.com/${organisation.accountName}/${project.name}/_apis/git/repositories/${repositoryId}/items?api-version=7.1-preview.1`
  );
};

export const getTree = async (organisation, project, repositoryId, sha1) => {
  return authorizedRequest(
    `https://dev.azure.com/${organisation.accountName}/${project.name}/_apis/git/repositories/${repositoryId}/trees/${sha1}?recursive=true&api-version=7.1-preview.1`
  );
};

export const getItemContent = async (organisation, project, repositoryId, path) => {
  const url = `https://dev.azure.com/${organisation.accountName}/${
    project.name
  }/_apis/git/repositories/${repositoryId}/items?api-version=7.1-preview.1&path=${encodeURIComponent(
    path
  )}`;
  return authorizedRequest(url, {}, false);
};
