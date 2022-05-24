jest.mock('@actions/core');
jest.mock('@actions/github');

const core = require('@actions/core');
const github = require('@actions/github');
const run = require('../src/delete-releases');

/* eslint-disable no-undef */
describe('Delete releases', () => {
  let listReleases;
  let deleteRelease;
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  setup = (firstListMock, secondListMock, deleteMock) => {
    listReleases = jest.fn().mockReturnValueOnce(firstListMock).mockReturnValueOnce(secondListMock);
    listReleases.mockClear();

    deleteRelease = jest.fn().mockReturnValue({ status: 204 });
    if (deleteMock) {
      deleteRelease = jest.fn().mockReturnValue(deleteMock);
    }
    deleteRelease.mockClear();

    github.context.repo = {
      owner: 'owner',
      repo: 'repo'
    };

    const octokit = {
      rest: {
        repos: {
          listReleases,
          deleteRelease
        }
      }
    };

    github.getOctokit.mockImplementation(() => octokit);
  };

  test('First call return 100 releases, calls again', async () => {
    const releases = {
      data: [],
      status: 200
    };

    [...Array(100).keys()].forEach((key) => {
      releases.data.push({
        id: `releaseId${key}`
      });
    });

    setup(releases, {
      data: [
        {
          id: 'releaseId100',
          draft: false,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId101',
          draft: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId102',
          draft: false,
          name: '1.0.0',
          created_at: new Date().toISOString()
        }
      ],
      status: 200
    });

    process.env.INPUT_NAME = '1.0.0';
    process.env.INPUT_KEEP = '1';
    process.env.INPUT_TYPES = 'draft';

    core.getInput = jest.requireActual('@actions/core');

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 2,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([]);
  });
});
