import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CommitInfo } from '../types';
import { Button } from '../ui';

interface CommitTooltipContentProps {
  commit: CommitInfo;
}

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

  const formattedDate = useMemo(() => formatFullDate(commit.date), [commit.date]);

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

  return (
    <div className="flex max-w-sm flex-col gap-2 text-text1">
      <div className="text-sm font-semibold break-words">{commit.message}</div>

      <div className="flex flex-col gap-1 text-xs text-text2">
        <div className="flex items-center gap-2">
          <span aria-hidden>📅</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden>👤</span>
          <span className="break-words">{commit.author}</span>
        </div>
        <div className="flex items-start gap-2">
          <span aria-hidden className="mt-[1px]">
            🔗
          </span>
          <span className="font-mono text-text1 break-all">{commit.hash}</span>
        </div>
      </div>

      <div className="pt-1">
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copyState === 'copied' ? 'Copiado!' : copyState === 'error' ? 'Falha ao copiar' : 'Copiar Hash'}
        </Button>
      </div>
    </div>
  );
};

export default CommitTooltipContent;
