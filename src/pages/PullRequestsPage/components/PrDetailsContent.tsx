import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GitBranch, ArrowRight, Check, AlertTriangle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { SkeletonLine, SkeletonBlock } from '@/ui/Skeleton';
import { isTauriRuntime } from '@/demo/demoMode';
import { formatDate } from '@/lib/formatDate';
import { MarkdownBody } from '@/components/MarkdownBody';
import type { PullRequestDetail, PrReview, PrState, PrReviewState } from '@/types';

interface PrDetailsContentProps {
  detail: PullRequestDetail | null;
  isLoading: boolean;
}

const StateBadge: React.FC<{ state: PrState }> = ({ state }) => {
  switch (state) {
    case 'OPEN':
      return <Badge variant="success">{state}</Badge>;
    case 'CLOSED':
      return <Badge variant="danger">{state}</Badge>;
    case 'MERGED':
      return <Badge variant="info">{state}</Badge>;
    default:
      return <Badge>{state}</Badge>;
  }
};

const ReviewStateBadge: React.FC<{ state: PrReviewState; t: (key: string) => string }> = ({ state, t }) => {
  switch (state) {
    case 'APPROVED':
      return <Badge variant="success">{t('comments.approved')}</Badge>;
    case 'CHANGES_REQUESTED':
      return <Badge variant="danger">{t('comments.changesRequested')}</Badge>;
    case 'COMMENTED':
      return <Badge>{t('comments.commented')}</Badge>;
    case 'PENDING':
      return <Badge variant="warning">{t('comments.pending')}</Badge>;
    case 'DISMISSED':
      return <Badge>{t('comments.dismissed')}</Badge>;
    default:
      return <Badge>{state}</Badge>;
  }
};

const ReviewBlock: React.FC<{ review: PrReview; t: (key: string) => string }> = ({ review, t }) => (
  <div className="rounded-card-inner border border-border1 bg-surface2/20 p-3">
    <div className="mb-1 flex items-center gap-2 text-xs text-text3">
      <span className="font-semibold text-text2">{review.author_login}</span>
      <ReviewStateBadge state={review.state} t={t} />
      <span className="ml-auto">{formatDate(review.submitted_at)}</span>
    </div>
    {review.body?.trim() && (
      <MarkdownBody content={review.body} className="mb-2" />
    )}
    {review.comments.length > 0 && (
      <div className="mt-2 flex flex-col gap-2 border-t border-border1 pt-2">
        {review.comments.map((rc, j) => (
          <div key={`rc-${j}`} className="rounded-card-inner bg-surface2/30 p-2 text-xs">
            <div className="mb-1 flex items-center gap-2 text-text3">
              <span className="font-semibold text-text2">{rc.author_login}</span>
              <span className="font-mono text-[10px] truncate text-text3">{rc.path}{rc.line !== null ? `:${rc.line}` : ''}</span>
            </div>
            <MarkdownBody content={rc.body} />
          </div>
        ))}
      </div>
    )}
  </div>
);

export const PrDetailsContent: React.FC<PrDetailsContentProps> = React.memo(({ detail, isLoading }) => {
  const { t } = useTranslation('pullRequests');

  const handleOpenOnGitHub = useCallback(async () => {
    if (!detail?.url) return;
    try {
      if (isTauriRuntime()) {
        const { openUrl } = await import('@tauri-apps/plugin-opener');
        await openUrl(detail.url);
      } else {
        window.open(detail.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  }, [detail?.url]);

  const mergeableIcon = useMemo(() => {
    if (!detail) return null;
    switch (detail.mergeable) {
      case 'MERGEABLE':
        return (
          <div className="flex items-center gap-2 text-sm text-success">
            <Check size={16} />
            <span>{t('mergeable.MERGEABLE')}</span>
          </div>
        );
      case 'CONFLICTING':
        return (
          <div className="flex items-center gap-2 text-sm text-danger">
            <AlertTriangle size={16} />
            <span>{t('mergeable.CONFLICTING')}</span>
          </div>
        );
      case 'UNKNOWN':
        return (
          <div className="flex items-center gap-2 text-sm text-text3">
            <span>{t('mergeable.UNKNOWN')}</span>
          </div>
        );
      default:
        return null;
    }
  }, [detail, t]);

  if (isLoading && !detail) {
    return (
      <div className="space-y-4 p-4">
        <SkeletonLine className="w-3/4 h-6" />
        <SkeletonLine className="w-1/2" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonLine className="w-2/3" />
        <SkeletonBlock className="h-32 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text3">
        {t('diff.empty')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header: title, state, draft */}
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text1">{detail.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text3 font-mono">#{detail.number}</span>
          <StateBadge state={detail.state} />
          {detail.is_draft && <Badge>{t('detail.draft')}</Badge>}
          <span className="text-xs text-text3">
            {t('detail.by', { author: detail.author_login })}
          </span>
        </div>
      </div>

      {/* Branch info */}
      <div className="flex items-center gap-2 text-sm text-text2">
        <GitBranch size={14} className="shrink-0 text-text3" />
        <span className="font-mono text-xs truncate">{detail.head_ref_name}</span>
        <ArrowRight size={14} className="shrink-0 text-text3" />
        <span className="font-mono text-xs truncate">{detail.base_ref_name}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-sm">
        <span className="font-mono text-success">+{detail.additions}</span>
        <span className="font-mono text-danger">-{detail.deletions}</span>
        <span className="text-text3">
          {detail.changed_files} {detail.changed_files === 1 ? 'file' : 'files'}
        </span>
      </div>

      {/* Conflict status */}
      {mergeableIcon}

      {/* Body */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase text-text3">{t('detail.body')}</h4>
        {detail.body?.trim() ? (
          <MarkdownBody
            content={detail.body}
            className="rounded-card-inner border border-border1 bg-surface2/30 p-3"
          />
        ) : (
          <p className="text-sm text-text3 italic">{t('detail.noBody')}</p>
        )}
      </div>

      {/* Comments */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase text-text3">
          {t('comments.title')} ({detail.comments.length})
        </h4>
        {detail.comments.length === 0 ? (
          <p className="text-sm text-text3">{t('comments.noComments')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {detail.comments.map((comment, i) => (
              <div
                key={`comment-${i}`}
                className="rounded-card-inner border border-border1 bg-surface2/20 p-3"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-text3">
                  <span className="font-semibold text-text2">{comment.author_login}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDate(comment.created_at)}</span>
                </div>
                <MarkdownBody content={comment.body} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      {detail.reviews.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase text-text3">
            {t('comments.reviews')} ({detail.reviews.length})
          </h4>
          <div className="flex flex-col gap-3">
            {detail.reviews.map((review, i) => (
              <ReviewBlock key={`review-${i}`} review={review} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Open on GitHub button */}
      <button
        type="button"
        onClick={handleOpenOnGitHub}
        className="flex items-center justify-center gap-2 rounded-button border border-border1 bg-surface2/30 px-4 py-2.5 text-sm font-medium text-text1 transition-colors hover:bg-surface2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
      >
        <ExternalLink size={14} />
        {t('detail.openOnGitHub')}
      </button>
    </div>
  );
});

PrDetailsContent.displayName = 'PrDetailsContent';
