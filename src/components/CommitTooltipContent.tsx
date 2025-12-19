import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { CommitInfo } from '../types';
import { isDemoMode, isTauriRuntime } from '../demo/demoMode';

interface CommitTooltipContentProps {
  commit: CommitInfo;
}

interface CommitShortStatPayload {
  files_changed: number | null;
  insertions: number | null;
  deletions: number | null;
}

let cachedOriginUrl: string | null | undefined;
let cachedOriginUrlPromise: Promise<string | null> | null = null;

const fetchOriginUrl = async (): Promise<string | null> => {
  if (cachedOriginUrl !== undefined) return cachedOriginUrl;
  if (cachedOriginUrlPromise) return cachedOriginUrlPromise;

  cachedOriginUrlPromise = invoke<string | null>('get_remote_origin_url_cmd')
    .then((value) => {
      const normalized = typeof value === 'string' ? value.trim() : '';
      cachedOriginUrl = normalized || null;
      return cachedOriginUrl;
    })
    .catch(() => {
      cachedOriginUrl = null;
      return null;
    })
    .finally(() => {
      cachedOriginUrlPromise = null;
    });

  return cachedOriginUrlPromise;
};

const normalizeGitHubRemote = (remoteUrl: string): string | null => {
  const url = remoteUrl.trim().replace(/\/+$/, '');
  if (!url) return null;

  const sshMatch = url.match(/^git@github\.com:(.+?)(?:\.git)?$/i);
  if (sshMatch) return `https://github.com/${sshMatch[1].replace(/\.git$/i, '')}`;

  const sshUrlMatch = url.match(/^ssh:\/\/git@github\.com\/(.+?)(?:\.git)?$/i);
  if (sshUrlMatch) return `https://github.com/${sshUrlMatch[1].replace(/\.git$/i, '')}`;

  const httpsMatch = url.match(/^https?:\/\/github\.com\/(.+?)(?:\.git)?$/i);
  if (httpsMatch) return `https://github.com/${httpsMatch[1].replace(/\.git$/i, '')}`;

  return null;
};

const formatFullDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = date.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) return rtf.format(diffSeconds, 'second');

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day');

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month');

  const diffYears = Math.round(diffMonths / 12);
  return rtf.format(diffYears, 'year');
};

const splitCommitMessage = (message: string) => {
  const normalized = message.replace(/\r\n/g, '\n');
  const [firstLine, ...rest] = normalized.split('\n');
  const subject = (firstLine ?? '').trimEnd();
  const body = rest.join('\n').trim();
  return { subject: subject || message, body };
};

type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; code: string };

const parseMarkdown = (input: string): MarkdownBlock[] => {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];

  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const text = paragraphLines.join('\n').trimEnd();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraphLines = [];
  };

  for (let i = 0; i < lines.length; ) {
    const line = lines[i] ?? '';

    if (/^\s*```/.test(line)) {
      flushParagraph();
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !/^\s*```/.test(lines[i] ?? '')) {
        codeLines.push(lines[i] ?? '');
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: 'code', code: codeLines.join('\n').trimEnd() });
      continue;
    }

    const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i] ?? '';
        const match = current.match(/^\s*[-*+]\s+(.*)$/);
        if (!match) break;
        items.push(match[1]);
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    const olMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i] ?? '';
        const match = current.match(/^\s*\d+[.)]\s+(.*)$/);
        if (!match) break;
        items.push(match[1]);
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      i += 1;
      continue;
    }

    paragraphLines.push(line);
    i += 1;
  }

  flushParagraph();
  return blocks;
};

const renderInlineCode = (text: string) => {
  const parts = text.split(/(`[^`]*`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const value = part.slice(1, -1);
      return (
        <code
          key={`code-${index}`}
          className="rounded-sm bg-surface2/80 px-1 py-0.5 font-mono text-[0.75rem] text-text1"
        >
          {value}
        </code>
      );
    }
    return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
  });
};

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.select();

  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!ok) {
    throw new Error('Failed to copy');
  }
};

export const CommitTooltipContent: React.FC<CommitTooltipContentProps> = ({ commit }) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const resetTimerRef = useRef<number | null>(null);
  const [shortStat, setShortStat] = useState<CommitShortStatPayload | null>(null);
  const [githubBaseUrl, setGithubBaseUrl] = useState<string | null>(null);

  const formattedDate = useMemo(() => formatFullDate(commit.date), [commit.date]);
  const relativeTime = useMemo(() => formatRelativeTime(commit.date), [commit.date]);
  const { subject, body } = useMemo(() => splitCommitMessage(commit.message), [commit.message]);
  const shortHash = useMemo(() => commit.hash.substring(0, 7), [commit.hash]);
  const markdownBlocks = useMemo(() => (body ? parseMarkdown(body) : []), [body]);
  const githubCommitUrl = useMemo(
    () => (githubBaseUrl ? `${githubBaseUrl}/commit/${commit.hash}` : null),
    [commit.hash, githubBaseUrl],
  );

  useEffect(() => {
    if (!isTauriRuntime() || isDemoMode()) return;
    let cancelled = false;
    invoke<CommitShortStatPayload>('get_commit_shortstat_cmd', { hash: commit.hash })
      .then((payload) => {
        if (!cancelled) setShortStat(payload);
      })
      .catch(() => {
        if (!cancelled) setShortStat(null);
      });
    return () => {
      cancelled = true;
    };
  }, [commit.hash]);

  useEffect(() => {
    if (!isTauriRuntime() || isDemoMode()) return;
    let cancelled = false;
    fetchOriginUrl().then((origin) => {
      if (cancelled) return;
      setGithubBaseUrl(origin ? normalizeGitHubRemote(origin) : null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await copyText(commit.hash);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopyState('idle');
      resetTimerRef.current = null;
    }, 1500);
  }, [commit.hash]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleOpenOnGitHub = useCallback(async () => {
    if (!githubCommitUrl) return;
    try {
      if (isTauriRuntime()) {
        const { openUrl } = await import('@tauri-apps/plugin-opener');
        await openUrl(githubCommitUrl);
      } else {
        window.open(githubCommitUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  }, [githubCommitUrl]);

  const shortStatLine = useMemo(() => {
    if (!shortStat) return null;

    const parts: React.ReactNode[] = [];
    const addPart = (node: React.ReactNode) => {
      if (parts.length) {
        parts.push(<React.Fragment key={`sep-${parts.length}`}>, </React.Fragment>);
      }
      parts.push(node);
    };

    if (shortStat.files_changed !== null) {
      const value = shortStat.files_changed;
      const label = value === 1 ? 'file changed' : 'files changed';
      addPart(<span key="files">{value} {label}</span>);
    }

    if (shortStat.insertions !== null) {
      const value = shortStat.insertions;
      const label = value === 1 ? 'insertion(+)' : 'insertions(+)';
      addPart(
        <span key="ins" className="text-successFg">
          {value} {label}
        </span>,
      );
    }

    if (shortStat.deletions !== null) {
      const value = shortStat.deletions;
      const label = value === 1 ? 'deletion(-)' : 'deletions(-)';
      addPart(
        <span key="del" className="text-danger">
          {value} {label}
        </span>,
      );
    }

    if (!parts.length) return null;
    return parts;
  }, [shortStat]);

  return (
    <div className="flex w-[520px] max-w-[min(520px,calc(100vw-24px))] flex-col divide-y divide-border1/60 text-text1">
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-text2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md bg-highlight/15 text-highlight ring-1 ring-border1/70"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="M8 4h8v4H8V4Zm0 12h8v4H8v-4Zm-2-6h12v4H6v-4Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="font-semibold text-highlight break-words">{commit.author}</span>
        {relativeTime && (
          <>
            <span aria-hidden>•</span>
            <span>{relativeTime}</span>
          </>
        )}
        <span className="text-text3">
          ({formattedDate})
        </span>
      </div>

      <div className="px-3 py-2">
        <div className="text-sm font-semibold text-text1 whitespace-pre-wrap break-words">{subject}</div>

        {body && (
          <div className="mt-2 max-h-[240px] overflow-auto pr-1 text-sm text-text1 leading-snug">
            <div className="flex flex-col gap-2">
              {markdownBlocks.map((block, index) => {
                if (block.type === 'ul') {
                  return (
                    <ul key={`ul-${index}`} className="ml-5 list-disc space-y-1">
                      {block.items.map((item, itemIndex) => (
                        <li key={`ul-${index}-${itemIndex}`} className="break-words">
                          {renderInlineCode(item)}
                        </li>
                      ))}
                    </ul>
                  );
                }

                if (block.type === 'ol') {
                  return (
                    <ol key={`ol-${index}`} className="ml-5 list-decimal space-y-1">
                      {block.items.map((item, itemIndex) => (
                        <li key={`ol-${index}-${itemIndex}`} className="break-words">
                          {renderInlineCode(item)}
                        </li>
                      ))}
                    </ol>
                  );
                }

                if (block.type === 'code') {
                  return (
                    <pre
                      key={`code-${index}`}
                      className="overflow-auto rounded-input border border-border1 bg-surface2/70 p-2 font-mono text-[0.75rem] text-text1"
                    >
                      {block.code}
                    </pre>
                  );
                }

                return (
                  <p key={`p-${index}`} className="whitespace-pre-wrap break-words">
                    {renderInlineCode(block.text)}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {shortStatLine && (
        <div className="px-3 py-2 text-xs text-text2">{shortStatLine}</div>
      )}

      <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-text2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex items-center gap-2 font-mono text-highlight">
            <span aria-hidden>⌁</span>
            {shortHash}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-button px-2 py-1 text-text2 transition-colors hover:bg-surface2/70 hover:text-text1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
            aria-label="Copy commit hash"
            title="Copy commit hash"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M9 9h10v12H9V9Zm-4 6H3V3h12v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {githubCommitUrl && (
            <>
              <span className="mx-1 h-4 w-px bg-border1/60" aria-hidden />
              <button
                type="button"
                onClick={handleOpenOnGitHub}
                className="inline-flex items-center gap-2 rounded-button px-2 py-1 text-highlight transition-colors hover:bg-surface2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
              >
                <span>Open on GitHub</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                  <path
                    d="M10 6H6v12h12v-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 4h6v6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20 4l-9 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {copyState !== 'idle' && (
          <span className={copyState === 'copied' ? 'text-successFg' : 'text-danger'}>
            {copyState === 'copied' ? 'Copied' : 'Copy failed'}
          </span>
        )}
      </div>
    </div>
  );
};

export default CommitTooltipContent;
