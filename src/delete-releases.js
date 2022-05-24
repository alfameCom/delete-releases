const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

    const { owner, repo } = github.context.repo;

    await new Promise(r => setTimeout(r, 10000));

    const listAllReleases = async function listReleases(pageNumber = 1) {
      const listReleasesResponse = await octokit.rest.repos.listReleases({
        owner,
        repo,
        per_page: 100,
        page: pageNumber
      });

      if (listReleasesResponse.status !== 200) {
        throw new Error('Error listing releases');
      }

      const releases = listReleasesResponse.data;

      core.info(releases);

      if (releases.length === 100) {
        return releases.concat(await listAllReleases(pageNumber + 1));
      }

      return releases;
    };

    let matchingReleases = await listAllReleases();

    core.info(`Found ${matchingReleases.length} releases`);

    if (core.getInput('types') && core.getInput('types') !== '') {
      let includeDrafts = false;
      let includePrereleases = false;
      let includeReleases = false;

      core
        .getInput('types')
        .split(',')
        .forEach((type) => {
          switch (type) {
            case 'draft':
              includeDrafts = true;
              break;
            case 'prerelease':
              includePrereleases = true;
              break;
            case 'release':
              includeReleases = true;
              break;
            default:
              throw new Error(`Invalid type ${type}`);
          }
        });

      matchingReleases = matchingReleases.filter((release) => {
        let returnValue = false;

        if (!returnValue && includeReleases && !release.draft && !release.prerelease) {
          returnValue = true;
        }

        if (!returnValue && includePrereleases) {
          returnValue = release.prerelease;
        }

        if (!returnValue && includeDrafts) {
          returnValue = release.draft;
        }

        return returnValue;
      });
    }

    if (core.getInput('name') && core.getInput('name') !== '') {
      matchingReleases = matchingReleases.filter((release) => release.name === core.getInput('name'));
    }

    if (core.getInput('keep') && core.getInput('keep') !== '') {
      matchingReleases = matchingReleases
        .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
        .slice(core.getInput('keep'));
    }

    core.info(`Deleting ${matchingReleases.length} releases`);

    const deleteTasks = [];

    matchingReleases.forEach((release) => {
      deleteTasks.push(
        octokit.rest.repos.deleteRelease({
          owner,
          repo,
          release_id: release.id
        })
      );
    });

    const results = await Promise.all(deleteTasks);

    results.forEach((result) => {
      if (result.status !== 204) {
        throw new Error('Error deleting releases');
      }
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
