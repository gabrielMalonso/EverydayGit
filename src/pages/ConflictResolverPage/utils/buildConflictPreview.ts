import type { ConflictFile, HunkResolution } from '@/types';

export type PreviewHighlight = 'ours' | 'theirs' | 'resolved' | 'marker';
export type PreviewMode = 'ours' | 'theirs' | 'result';

export interface PreviewLine {
  text: string;
  highlight?: PreviewHighlight;
}

export const buildConflictPreviewLines = (
  conflictFile: ConflictFile,
  fileResolutions?: Map<number, HunkResolution>,
  mode: PreviewMode = 'result',
) => {
  if (conflictFile.conflicts.length === 0) {
    return conflictFile.content.split('\n').map((line) => ({ text: line }));
  }

  const lines = conflictFile.content.split('\n');
  const outputLines: PreviewLine[] = [];
  let inConflict = false;
  let section: 'ours' | 'theirs' | null = null;
  let hunkIndex = 0;
  let skipBlock = false;
  let activeResolution: HunkResolution | null = null;

  for (const line of lines) {
    if (!inConflict && line.startsWith('<<<<<<<')) {
      const hunk = conflictFile.conflicts[hunkIndex];
      activeResolution = hunk ? fileResolutions?.get(hunk.id) ?? null : null;

      if (mode === 'result' && activeResolution) {
        activeResolution.content.split('\n').forEach((resolvedLine) => {
          outputLines.push({ text: resolvedLine, highlight: 'resolved' });
        });
        skipBlock = true;
      } else {
        skipBlock = false;
        if (mode === 'result') {
          outputLines.push({ text: line, highlight: 'marker' });
        }
      }

      inConflict = true;
      section = 'ours';
      continue;
    }

    if (inConflict && line.startsWith('=======')) {
      section = 'theirs';
      if (mode === 'result' && !activeResolution) {
        outputLines.push({ text: line, highlight: 'marker' });
      }
      continue;
    }

    if (inConflict && line.startsWith('>>>>>>>')) {
      if (mode === 'result' && !activeResolution) {
        outputLines.push({ text: line, highlight: 'marker' });
      }
      inConflict = false;
      section = null;
      skipBlock = false;
      activeResolution = null;
      hunkIndex += 1;
      continue;
    }

    if (inConflict) {
      if (skipBlock) {
        continue;
      }

      if (mode === 'ours') {
        if (section === 'ours') {
          outputLines.push({ text: line, highlight: 'ours' });
        }
        continue;
      }

      if (mode === 'theirs') {
        if (section === 'theirs') {
          outputLines.push({ text: line, highlight: 'theirs' });
        }
        continue;
      }

      if (mode === 'result') {
        outputLines.push({ text: line, highlight: section === 'ours' ? 'ours' : 'theirs' });
        continue;
      }
    }

    outputLines.push({ text: line });
  }

  return outputLines;
};
