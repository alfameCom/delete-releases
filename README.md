# delete-releases

[![Actions Status](https://github.com/alfameCom/delete-releases/workflows/units-test/badge.svg)](https://github.com/alfameCom/delete-releases/actions)

Delete GitHub releases with optional filters

## Usage

```yaml
name: Delete release
on:
  push:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Delete all releases
      uses: alfameCom/delete-releases@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

### name

Name of the release, only delete releases with this name

```yaml
uses: alfameCom/delete-releases@v1
with:
  name: '1.0.0'
```

### keep

Number of matching releases to keep, keeps the most recent releases. The default is 0.

```yaml
uses: alfameCom/delete-releases@v1
with:
  keep: '1'
```

### types

Comma-separated list of types to delete. Includes all types by default.

```yaml
uses: alfameCom/delete-releases@v1
with:
  types: 'draft'
```

## Package for distribution

GitHub Actions will run the entry point from the action.yml. Packaging assembles the code into one file that can be checked in to Git, enabling fast and reliable execution and preventing the need to check in node_modules.

Actions are run from GitHub repos.  Packaging the action will create a packaged action in the dist folder.

Run prepare

```bash
npm run prepare
```

Since the packaged index.js is run from the dist folder.

```bash
git add dist
```

## Create a release branch

Users shouldn't consume the action from master since that would be latest code and actions can break compatibility between major versions.

Checkin to the v1 release branch

```bash
git checkout -b v1
git commit -a -m "v1 release"
```

```bash
git push origin v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
