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

  setup = (listMock, deleteMock) => {
    listReleases = jest.fn().mockReturnValue(listMock);
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

  test('No matching draft releases, nothing deleted', async () => {
    setup({
      data: [
        {
          id: 'releaseId1',
          draft: false,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId2',
          draft: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId3',
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
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([]);
  });

  test('No matching prerelease releases, nothing deleted', async () => {
    setup({
      data: [
        {
          id: 'releaseId1',
          draft: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId2',
          release: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId3',
          draft: false,
          name: '1.0.0',
          created_at: new Date().toISOString()
        }
      ],
      status: 200
    });

    process.env.INPUT_NAME = '1.0.0';
    process.env.INPUT_KEEP = '1';
    process.env.INPUT_TYPES = 'prerelease';

    core.getInput = jest.requireActual('@actions/core');

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([]);
  });

  test('No matching release releases, nothing deleted', async () => {
    setup({
      data: [
        {
          id: 'releaseId1',
          draft: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId2',
          prerelease: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId3',
          draft: false,
          name: '1.0.0',
          created_at: new Date().toISOString()
        }
      ],
      status: 200
    });

    process.env.INPUT_NAME = '1.0.0';
    process.env.INPUT_KEEP = '1';
    process.env.INPUT_TYPES = 'release';

    core.getInput = jest.requireActual('@actions/core');

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([]);
  });

  test('One matching draft release with keep = 1, nothing deleted', async () => {
    setup({
      data: [
        {
          id: 'releaseId1',
          draft: false,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId2',
          draft: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId3',
          draft: false,
          name: '1.0.0',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId4',
          draft: true,
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
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([]);
  });

  test('One matching prerelease release with keep = 1, nothing deleted', async () => {
    setup({
      data: [
        {
          id: 'releaseId1',
          prerelease: false,
          draft: false,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId2',
          prerelease: false,
          draft: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId3',
          prerelease: true,
          draft: false,
          name: '1.0.0',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId4',
          prerelease: false,
          draft: true,
          name: '1.0.0',
          created_at: new Date().toISOString()
        }
      ],
      status: 200
    });

    process.env.INPUT_NAME = '1.0.0';
    process.env.INPUT_KEEP = '1';
    process.env.INPUT_TYPES = 'prerelease';

    core.getInput = jest.requireActual('@actions/core').getInput;

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([]);
  });

  test('One matching release with keep = 1, nothing deleted', async () => {
    setup({
      data: [
        {
          id: 'releaseId1',
          prerelease: false,
          draft: false,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId2',
          prerelease: false,
          draft: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId3',
          prerelease: true,
          draft: false,
          name: '1.0.0',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId4',
          prerelease: false,
          draft: true,
          name: '1.0.0',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId5',
          prerelease: false,
          draft: false,
          name: '1.0.0',
          created_at: new Date().toISOString()
        }
      ],
      status: 200
    });

    process.env.INPUT_NAME = '1.0.0';
    process.env.INPUT_KEEP = '1';
    process.env.INPUT_TYPES = 'release';

    core.getInput = jest.requireActual('@actions/core').getInput;

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([]);
  });

  test('Two matching draft releases with keep = 1, delete older draft release', async () => {
    setup({
      data: [
        {
          id: 'releaseId1',
          draft: false,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId2',
          draft: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId3',
          draft: false,
          name: '1.0.0',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId4',
          draft: true,
          name: '1.0.0',
          created_at: '2022-01-01T11:03:39Z'
        },
        {
          id: 'releaseId5',
          draft: true,
          name: '1.0.0',
          created_at: '2022-01-02T11:03:39Z'
        }
      ],
      status: 200
    });

    process.env.INPUT_NAME = '1.0.0';
    process.env.INPUT_KEEP = '1';
    process.env.INPUT_TYPES = 'draft';

    core.getInput = jest.requireActual('@actions/core').getInput;

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([
      [
        {
          owner: 'owner',
          repo: 'repo',
          release_id: 'releaseId4'
        }
      ]
    ]);
  });

  test('Two matching draft releases with keep = 0, delete both', async () => {
    setup({
      data: [
        {
          id: 'releaseId1',
          draft: false,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId2',
          draft: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId3',
          draft: false,
          name: '1.0.0',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId4',
          draft: true,
          name: '1.0.0',
          created_at: '2022-01-01T11:03:39Z'
        },
        {
          id: 'releaseId5',
          draft: true,
          name: '1.0.0',
          created_at: '2022-01-02T11:03:39Z'
        }
      ],
      status: 200
    });

    process.env.INPUT_NAME = '1.0.0';
    process.env.INPUT_KEEP = '0';
    process.env.INPUT_TYPES = 'draft';

    core.getInput = jest.requireActual('@actions/core').getInput;

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([
      [
        {
          owner: 'owner',
          repo: 'repo',
          release_id: 'releaseId5'
        }
      ],
      [
        {
          owner: 'owner',
          repo: 'repo',
          release_id: 'releaseId4'
        }
      ]
    ]);
  });

  test('Five matching releases with keep = 3, delete oldest two', async () => {
    setup({
      data: [
        {
          id: 'releaseId1',
          prerelease: false,
          draft: true,
          name: '0.0.9',
          created_at: '2022-01-01T11:03:39Z'
        },
        {
          id: 'releaseId2',
          prerelease: false,
          draft: false,
          name: '0.0.9',
          created_at: '2022-01-02T11:03:39Z'
        },
        {
          id: 'releaseId3',
          prerelease: false,
          draft: true,
          name: '1.0.0',
          created_at: '2022-01-01T11:03:39Z'
        },
        {
          id: 'releaseId4',
          prerelease: true,
          draft: false,
          name: '1.0.0',
          created_at: '2022-01-02T11:03:39Z'
        },
        {
          id: 'releaseId5',
          prerelease: false,
          draft: false,
          name: '1.0.0',
          created_at: '2022-01-03T11:03:39Z'
        }
      ],
      status: 200
    });

    process.env.INPUT_KEEP = '3';

    core.getInput = jest.requireActual('@actions/core').getInput;

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([
      [
        {
          owner: 'owner',
          repo: 'repo',
          release_id: 'releaseId1'
        }
      ],
      [
        {
          owner: 'owner',
          repo: 'repo',
          release_id: 'releaseId3'
        }
      ]
    ]);
  });

  test('No inputs, delete all releases', async () => {
    setup({
      data: [
        {
          id: 'releaseId1',
          draft: false,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId2',
          draft: true,
          name: '0.0.9',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId3',
          draft: false,
          name: '1.0.0',
          created_at: new Date().toISOString()
        },
        {
          id: 'releaseId4',
          draft: true,
          name: '1.0.0',
          created_at: '2022-01-01T11:03:39Z'
        },
        {
          id: 'releaseId5',
          draft: true,
          name: '1.0.0',
          created_at: '2022-01-02T11:03:39Z'
        }
      ],
      status: 200
    });

    core.getInput = jest.requireActual('@actions/core').getInput;

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease.mock.calls).toEqual([
      [
        {
          owner: 'owner',
          repo: 'repo',
          release_id: 'releaseId1'
        }
      ],
      [
        {
          owner: 'owner',
          repo: 'repo',
          release_id: 'releaseId2'
        }
      ],
      [
        {
          owner: 'owner',
          repo: 'repo',
          release_id: 'releaseId3'
        }
      ],
      [
        {
          owner: 'owner',
          repo: 'repo',
          release_id: 'releaseId4'
        }
      ],
      [
        {
          owner: 'owner',
          repo: 'repo',
          release_id: 'releaseId5'
        }
      ]
    ]);
  });

  test('Error listing', async () => {
    setup({
      status: 500
    });

    core.getInput = jest.requireActual('@actions/core').getInput;

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenLastCalledWith('Error listing releases');
  });

  test('Invalid type', async () => {
    setup(
      {
        data: [
          {
            id: 'releaseId1',
            draft: true,
            name: '1.0.0',
            created_at: '2022-01-01T11:03:39Z'
          },
          {
            id: 'releaseId2',
            draft: true,
            name: '1.0.0',
            created_at: '2022-01-02T11:03:39Z'
          }
        ],
        status: 200
      },
      {
        status: 500
      }
    );

    process.env.INPUT_NAME = '1.0.0';
    process.env.INPUT_KEEP = '1';
    process.env.INPUT_TYPES = 'invalid';

    core.getInput = jest.requireActual('@actions/core').getInput;

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(core.setFailed).toHaveBeenLastCalledWith('Invalid type invalid');
  });

  test('Error deleting', async () => {
    setup(
      {
        data: [
          {
            id: 'releaseId1',
            draft: true,
            name: '1.0.0',
            created_at: '2022-01-01T11:03:39Z'
          },
          {
            id: 'releaseId2',
            draft: true,
            name: '1.0.0',
            created_at: '2022-01-02T11:03:39Z'
          }
        ],
        status: 200
      },
      {
        status: 500
      }
    );

    process.env.INPUT_NAME = '1.0.0';
    process.env.INPUT_KEEP = '1';
    process.env.INPUT_TYPES = 'draft';

    core.getInput = jest.requireActual('@actions/core').getInput;

    await run();

    expect(listReleases).toHaveBeenLastCalledWith({
      owner: 'owner',
      page: 1,
      per_page: 100,
      repo: 'repo'
    });

    expect(deleteRelease).toHaveBeenLastCalledWith({
      owner: 'owner',
      repo: 'repo',
      release_id: 'releaseId1'
    });

    expect(core.setFailed).toHaveBeenLastCalledWith('Error deleting releases');
  });
});
