import { isDelete, isInsert, parseDiff } from 'react-diff-view';

type ParsedFile = ReturnType<typeof parseDiff>[number];

export const normalizePath = (path?: string | null): string => {
  if (!path) return '';
  return path.replace(/^a\//, '').replace(/^b\//, '');
};

export const getAddedDeletedCounts = (file: ParsedFile): { added: number; deleted: number } => {
  let added = 0;
  let deleted = 0;
  for (const hunk of file.hunks ?? []) {
    for (const change of hunk.changes ?? []) {
      if (isInsert(change)) added += 1;
      if (isDelete(change)) deleted += 1;
    }
  }
  return { added, deleted };
};

export const getFileLabel = (file: ParsedFile): string => {
  const oldPath = normalizePath(file.oldPath);
  const newPath = normalizePath(file.newPath);

  if (oldPath && newPath && oldPath !== newPath && oldPath !== '/dev/null') {
    return `${oldPath} \u2192 ${newPath}`;
  }

  if (newPath && newPath !== '/dev/null') return newPath;
  if (oldPath && oldPath !== '/dev/null') return oldPath;
  return 'Unknown file';
};
