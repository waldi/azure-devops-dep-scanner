import { mkdirp } from "mkdirp";
import fs from "fs/promises";
import path from "path";

import {
  getProjects,
  getRepositories,
  getItems,
  getTree,
  getItemContent,
  getProfile,
  getOrganisations,
} from "./services/azure.js";

const filesToExtract = ["package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"];
const outputDir = "output/repos";

await mkdirp(outputDir);

const getOrgaPath = (organisation) => `${outputDir}/${organisation.accountName}`;
const getProjectPath = (organisation, project) => `${getOrgaPath(organisation)}/${project.name}`;
const getRepositoryPath = (organisation, project, repository) =>
  `${getProjectPath(organisation, project)}/${repository.name}`;

const loadRepository = async (organisation, project, repository) => {
  try {
    const repositoryPath = getRepositoryPath(organisation, project, repository);

    await mkdirp(repositoryPath);

    const items = await getItems(organisation, project, repository.name);
    const item = items.value[0];

    const tree = await getTree(organisation, project, repository.name, item.objectId);

    const entries = tree.treeEntries.filter(({ relativePath }) =>
      filesToExtract.some((file) => relativePath.includes(file))
    );

    for (const entry of entries) {
      const entryContent = await getItemContent(
        organisation,
        project,
        repository.id,
        entry.relativePath
      );
      const filePath = path.join(repositoryPath, entry.relativePath);
      const dirName = path.dirname(filePath);
      await mkdirp(dirName);

      await fs.writeFile(filePath, entryContent);
    }
  } catch (err) {
    debugger;
    console.log("Could not load repository", repository.name, err);
  }
};

const loadProject = async (organisation, project) => {
  const projectPath = getProjectPath(organisation, project);
  await mkdirp(projectPath);

  const repositories = await getRepositories(organisation, project);
  for (const repository of repositories.value) {
    if (repository.size === 0) {
      console.log("      Skipping empty repository", repository.name);
      continue;
    }
    if (repository.isDisabled || repository.isInMaintenance) {
      console.log("      Skipping disabled repository", repository.name);
      continue;
    }
    await loadRepository(organisation, project, repository);
  }
};

const loadOrganisation = async (organisation) => {
  const orgaPath = getOrgaPath(organisation);
  await mkdirp(orgaPath);

  const projects = await getProjects(organisation);

  for (const project of projects.value) {
    await loadProject(organisation, project);
  }
};

const load = async () => {
  const profile = await getProfile();
  const organisations = await getOrganisations(profile.id);

  for (const organisation of organisations.value) {
    loadOrganisation(organisation);
  }
};

load();
