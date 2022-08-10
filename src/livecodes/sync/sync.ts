/* eslint-disable import/no-internal-modules */
import type { User } from '../models';
import type { Storage, SimpleStorage, Stores, ProjectStorage } from '../storage';
import { commitFile, getContent, GitHubFile } from '../services/github';
import { base64ToUint8Array, typedArraysAreEqual, Uint8ArrayToBase64 } from '../utils/utils';
import { Y, DeepDiff, applyChange, toJSON } from './diff';

export interface StoredSyncData {
  lastModified: number;
  data: Uint8Array;
  lastSyncSha: string;
}

interface GitHubContent {
  name: string;
  sha: string;
  type: 'file' | 'dir';
}

const getStorageData = async <T>(storage: Storage<T> | ProjectStorage | undefined) => {
  if (!storage) return [];
  return storage.getAllData();
};

const setStorageData = async <T>(storage: Storage<T> | ProjectStorage | undefined, data: T[]) => {
  if (!storage) return;
  await storage.clear();
  await storage.restore(data as any);
};

const changeDoc = (target: Y.Array<any>, data: any[] = []) => {
  const changes = DeepDiff.diff(toJSON(target), data) || [];
  target.doc?.transact(() => {
    for (const change of changes) {
      applyChange(target, change);
    }
  });
};

const repoDir = 'livecodes-data';
const rootArrayKey = 'data';

const syncStore = async ({
  user,
  repo,
  branch,
  stores,
  storeKey,
  remoteContent,
}: {
  user: User;
  repo: string;
  branch: string;
  stores: Stores;
  storeKey: keyof Stores;
  remoteContent: GitHubContent[];
}) => {
  const lastSyncSha = (await stores.sync?.getItem(storeKey))?.lastSyncSha;
  const filename = `${storeKey}.b64`;
  const path = `${repoDir}/${filename}`;

  const storage: SimpleStorage<any> | Storage<any> | ProjectStorage | undefined = stores[storeKey];
  if (!storage) return true;

  const isSimpleStorage = 'getValue' in storage;
  if (isSimpleStorage) return true;

  // ***************************
  // Get data: remote update, local update, current data in store
  // ***************************

  let remoteUpdate;
  const remoteFileExists = remoteContent.find((f) => f.name === filename) != null;
  const uptodate = remoteContent.find((f) => f.sha === lastSyncSha) != null;
  try {
    const remoteFile =
      !remoteFileExists || uptodate
        ? undefined
        : await getContent({
            user,
            repo,
            branch,
            path,
          });

    if (remoteFile?.content) {
      remoteUpdate = base64ToUint8Array(remoteFile.content);
    }
  } catch {
    return false;
  }

  const localUpdate = (await stores.sync?.getItem(storeKey))?.data;

  const currentData = await getStorageData(storage);

  // ***************************
  //           Merge
  // ***************************

  const doc = new Y.Doc();

  if (localUpdate) {
    Y.applyUpdate(doc, localUpdate);
    changeDoc(doc.getArray(rootArrayKey), currentData);
    if (remoteUpdate) {
      Y.applyUpdate(doc, remoteUpdate);
    }
  }

  if (!localUpdate && !remoteUpdate) {
    changeDoc(doc.getArray(rootArrayKey), currentData);
  }

  if (!localUpdate && remoteUpdate) {
    const remoteDoc = new Y.Doc();
    Y.applyUpdate(remoteDoc, remoteUpdate);
    const remoteData = toJSON<any[]>(remoteDoc.getArray(rootArrayKey));
    remoteDoc.destroy();

    // concat (currentData wins)
    const data = [...remoteData, ...currentData];

    changeDoc(doc.getArray(rootArrayKey), data);
  }

  // ***************************
  //       Save and push
  // ***************************

  try {
    // save to local stores
    const newData: any[] = toJSON(doc.getArray(rootArrayKey));
    const dataChanged = DeepDiff.diff(newData, currentData) != null;
    if (dataChanged) {
      await setStorageData(storage, newData);
    }

    // push to remote
    const newSyncUpdate = Y.encodeStateAsUpdate(doc);

    const shouldPushUpdate =
      !remoteFileExists ||
      (remoteUpdate && !typedArraysAreEqual(remoteUpdate, newSyncUpdate)) ||
      (uptodate && localUpdate && !typedArraysAreEqual(localUpdate, newSyncUpdate));

    if (shouldPushUpdate) {
      const file: GitHubFile = {
        path,
        content: Uint8ArrayToBase64(newSyncUpdate),
      };

      const result = await commitFile({
        file,
        user,
        repo,
        branch,
        message: 'sync ' + storeKey,
      });
      if (!result) {
        return false;
      }

      const dirEntries: GitHubContent[] = (
        await getContent({
          user,
          repo,
          branch,
          path: repoDir,
        })
      )?.entries;
      const sha = dirEntries?.find?.((f) => f.name === filename)?.sha;

      // save sync data
      const newData: StoredSyncData = {
        lastModified: Date.now(),
        data: newSyncUpdate,
        lastSyncSha: sha || '',
      };
      await stores.sync?.updateItem(storeKey, newData);
    }
  } catch {
    return false;
  }

  return true;
};

export const sync = async ({
  user,
  repo,
  branch = 'main',
  newRepo,
  stores,
}: {
  user: User;
  repo: string;
  branch?: string;
  newRepo: boolean;
  stores: Stores;
}) => {
  let remoteContent: GitHubContent[] = [];
  try {
    if (newRepo) {
      await commitFile({
        file: {
          path: repoDir + '/.gitkeep',
          content: '',
        },
        user,
        repo,
        branch,
        message: 'create data dir',
        description: 'LiveCodes Sync',
        newRepo,
        privateRepo: true,
        readmeContent: '# LiveCodes Sync',
      });
    } else {
      const repoRootEntries: GitHubContent[] = (
        await getContent({
          user,
          repo,
          branch,
          path: '',
        })
      )?.entries;

      if (repoRootEntries?.find?.((x) => x.type === 'dir' && x.name === repoDir)) {
        remoteContent = (
          await getContent({
            user,
            repo,
            branch,
            path: repoDir,
          })
        )?.entries;
      }
    }
  } catch {
    return false;
  }

  let success = true;
  const storeKeys = (Object.keys(stores) as Array<keyof Stores>).filter((k) =>
    ['projects', 'templates', 'assets'].includes(k),
  );

  for (const storeKey of storeKeys) {
    const result = await syncStore({
      user,
      repo,
      branch,
      stores,
      storeKey,
      remoteContent,
    });
    if (!result) {
      success = false;
    }
  }
  return success;
};
