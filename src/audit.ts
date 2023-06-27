import path from "path";
import fs from "fs/promises";
import { execa } from "execa";
import PQueue from "p-queue";

const getFiles = async (dir) => {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
};

const fileExists = (path) =>
  fs
    .stat(path)
    .then(() => true)
    .catch(() => false);

const tryParseJson = (string) => {
  try {
    return JSON.parse(string);
  } catch (err) {
    return null;
  }
};

const createAuditNpm = async (directory) => {
  const res = await execa("npm", ["audit", "--json"], { cwd: directory }).catch((err) => {
    return err;
  });
  return tryParseJson(res.stdout);
};

const createAuditYarn = async (directory) => {
  const res = await execa("yarn", ["audit", "--json"], { cwd: directory }).catch((err) => {
    return err;
  });
  return tryParseJson(res.stdout);
};

const createAudit = async (directory) => {
  if (fileExists(path.join(directory, "package-lock.json"))) return createAuditNpm(directory);
  if (fileExists(path.join(directory, "yarn.lock"))) return createAuditYarn(directory);
  return null;
};

const audit = async () => {
  const reposPath = path.join(process.cwd(), "output/repos");

  const filePaths = await getFiles(reposPath);
  const relativePaths = filePaths.map((filePath) => path.relative(process.cwd(), filePath));
  const relativeLockFilePaths = relativePaths.filter(
    (fileName) => fileName.includes("package-lock.json") || fileName.includes("yarn.lock")
  );

  const results = [];

  const queue = new PQueue({ concurrency: 10, autoStart: false });

  for (const lockFile of relativeLockFilePaths) {
    queue.add(async () => {
      console.log("Processing", lockFile);

      const dirName = path.dirname(lockFile);
      const audit = await createAudit(dirName);

      if (!audit) return;

      const parts = dirName.split("/");
      const organisation = parts[2];
      const project = parts[3];
      const repository = parts[4];
      const pathInRepo = `${parts.slice(5, -1).join("/")}/`;

      results.push({
        organisation,
        project,
        repository,
        pathInRepo,
        audit,
      });
    });
  }

  queue.start();

  await queue.onIdle();

  console.log("Done. Writing result.");
  fs.writeFile("output/audit.json", JSON.stringify(results, null, 2));
};

audit();
