# Azure DevOps Dependency Scanner

This work-in-progress project scans Azure DevOps organisations and projects and generates an audit file which can be further processed or be used to display all the results in an application.

## Environment Variables

This script requires a Azure DevOps personal access token with Code read permissions **over all organizations**. If you only want to scan a single organization, you can use a token with Code read permissions **over a single organization**.

| Variable                      | Description                                          |
| :---------------------------- | :--------------------------------------------------- |
| `AZURE_PERSONAL_ACCESS_TOKEN` | Personal access token with `Code - Read` permissions |

## Run Locally

Clone the project

```bash
  git clone https://github.com/waldi/azure-devops-dep-scanner.git
```

Go to the project directory

```bash
  cd azure-devops-dep-scanner
```

Install dependencies

```bash
  npm install
```

There are two npm scripts:

- `load-repos`: Downloads required files (e.g. lock files) for audit
- `audit`: Runs audit over all lock files that can be found in the output folder. Created `output/audit.json`

```bash
  npm run load-repos
  npm run audit
```

There are debug versions available for both commands.

## Running on Azure Pipeline

A example `azure-pipelines.yml` is included in the repository.

## Authors

- [@waldi](https://www.github.com/waldi)

## Sponsors

- [Appsfactory Gmbh](https://appsfactory.de/)
