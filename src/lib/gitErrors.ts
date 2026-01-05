import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

export type GitErrorId =
  | 'branch_in_worktree'
  | 'branch_not_merged'
  | 'push_rejected'
  | 'uncommitted_changes'
  | 'no_tracking'
  | 'auth_failed'
  | 'remote_not_found'
  | 'merge_commit'
  | 'unknown';

export interface GitErrorContext {
  operation: string;
  branchName?: string;
  hash?: string;
  /** Optional action handler to execute when user clicks the action button */
  onAction?: () => void | Promise<unknown>;
}

interface GitErrorPattern {
  id: GitErrorId;
  pattern: RegExp;
  /** Label for the action button (if applicable) */
  actionLabel?: string;
}

type ErrorActionHandler = (context: GitErrorContext) => void | Promise<void>;

// =============================================================================
// Error Patterns
// =============================================================================

const GIT_ERROR_PATTERNS: GitErrorPattern[] = [
  {
    id: 'branch_in_worktree',
    pattern: /cannot delete branch.*checked out at/i,
    actionLabel: 'Force delete',
  },
  {
    id: 'branch_not_merged',
    pattern: /not fully merged/i,
    actionLabel: 'Force delete (-D)',
  },
  {
    id: 'push_rejected',
    pattern: /rejected.*non-fast-forward|remote contains work|fetch first/i,
    actionLabel: 'Pull first',
  },
  {
    id: 'uncommitted_changes',
    pattern: /local changes.*would be overwritten|uncommitted changes/i,
    actionLabel: 'Stash',
  },
  {
    id: 'no_tracking',
    pattern: /no tracking information|no upstream branch/i,
  },
  {
    id: 'auth_failed',
    pattern: /authentication failed|could not read username/i,
  },
  {
    id: 'remote_not_found',
    pattern: /does not appear to be a git repository|could not resolve host/i,
  },
  {
    id: 'merge_commit',
    pattern: /is a merge|-m option/i,
  },
];

// =============================================================================
// Action Handlers Registry
// =============================================================================

const actionHandlers = new Map<GitErrorId, ErrorActionHandler>();

/**
 * Register a handler for a specific error type.
 * When handleGitError detects this error, it will show a toast with an action button.
 */
export function registerErrorAction(errorId: GitErrorId, handler: ErrorActionHandler): () => void {
  actionHandlers.set(errorId, handler);
  // Return cleanup function
  return () => {
    actionHandlers.delete(errorId);
  };
}

/**
 * Clear all registered action handlers.
 * Useful for testing or cleanup.
 */
export function clearErrorActions(): void {
  actionHandlers.clear();
}

// =============================================================================
// Error Message Extraction
// =============================================================================

/**
 * Extract the error message from various error formats.
 * Handles: string, Error, { message: string }, Tauri error format
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    // Tauri errors often come as { message: string }
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    // Some errors have stderr
    if ('stderr' in error && typeof (error as { stderr?: unknown }).stderr === 'string') {
      return (error as { stderr: string }).stderr;
    }
  }
  return String(error);
}

/**
 * Detect the error type based on the error message.
 */
export function detectErrorType(errorMessage: string): GitErrorId {
  for (const { id, pattern } of GIT_ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return id;
    }
  }
  return 'unknown';
}

/**
 * Get the action label for a specific error type.
 */
function getActionLabel(errorId: GitErrorId): string | undefined {
  const pattern = GIT_ERROR_PATTERNS.find((p) => p.id === errorId);
  return pattern?.actionLabel;
}

// =============================================================================
// Main Handler
// =============================================================================

/**
 * Handle a Git error by showing an appropriate toast notification.
 *
 * - For known errors with action handler in context: shows toast with action button
 * - For known errors without actions: shows the actual Git error message
 * - For unknown errors: shows the actual Git error message
 *
 * @param error - The error to handle
 * @param context - Context about the operation that failed
 */
export function handleGitError(error: unknown, context: GitErrorContext): void {
  const errorMessage = getErrorMessage(error);
  const errorId = detectErrorType(errorMessage);
  const actionLabel = getActionLabel(errorId);

  // Try context handler first, then fall back to registered handler
  const handler = context.onAction ?? actionHandlers.get(errorId);

  // If we have both an action label and a handler, show toast with action button
  if (actionLabel && handler) {
    toast.error(errorMessage, {
      duration: 8000, // Longer duration for actionable errors
      action: {
        label: actionLabel,
        onClick: () => {
          handler(context);
        },
      },
    });
    return;
  }

  // Otherwise, just show the error message
  toast.error(errorMessage, {
    duration: 5000,
  });
}
