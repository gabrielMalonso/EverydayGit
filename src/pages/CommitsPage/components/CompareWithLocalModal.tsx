import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Diff, Hunk, isDelete, isInsert, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import { X } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/ui';
import { Badge } from '@/components/Badge';
import type { CommitInfo } from '@/types';

interface CompareWithLocalModalProps {
    isOpen: boolean;
    onClose: () => void;
    commit: CommitInfo;
}

type ParsedFile = ReturnType<typeof parseDiff>[number];

interface FileItem {
    id: string;
    file: ParsedFile;
    filePath: string;
    label: string;
    added: number;
    deleted: number;
    status: 'modified' | 'added' | 'deleted';
}

const normalizePath = (path?: string | null) => {
    if (!path) return '';
    return path.replace(/^a\//, '').replace(/^b\//, '');
};

const getAddedDeletedCounts = (file: ParsedFile) => {
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

const getFileLabel = (file: ParsedFile) => {
    const oldPath = normalizePath(file.oldPath);
    const newPath = normalizePath(file.newPath);

    if (oldPath && newPath && oldPath !== newPath && oldPath !== '/dev/null') {
        return `${oldPath} → ${newPath}`;
    }

    if (newPath && newPath !== '/dev/null') return newPath;
    if (oldPath && oldPath !== '/dev/null') return oldPath;
    return 'Unknown file';
};

const getFileStatus = (file: ParsedFile): 'modified' | 'added' | 'deleted' => {
    const oldPath = normalizePath(file.oldPath);
    const newPath = normalizePath(file.newPath);

    if (oldPath === '/dev/null' || !oldPath) return 'added';
    if (newPath === '/dev/null' || !newPath) return 'deleted';
    return 'modified';
};

export const CompareWithLocalModal: React.FC<CompareWithLocalModalProps> = ({
    isOpen,
    onClose,
    commit,
}) => {
    const [diffText, setDiffText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const loadedHashRef = useRef<string | null>(null);

    const shortHash = commit.hash.substring(0, 7);

    // Load diff when modal opens - use invoke directly to avoid dependency issues
    useEffect(() => {
        if (!isOpen) {
            setDiffText('');
            setSelectedFile(null);
            setError(null);
            loadedHashRef.current = null;
            return;
        }

        // Prevent duplicate loads for same hash
        if (loadedHashRef.current === commit.hash) {
            return;
        }

        const loadDiff = async () => {
            console.log('[Action] Starting Compare with Local', { hash: commit.hash });
            loadedHashRef.current = commit.hash;
            setIsLoading(true);
            setError(null);

            try {
                const diff = await invoke<string>('get_commit_diff_cmd', { hash: commit.hash });
                setDiffText(diff);
                console.log('[Action] Compare with Local loaded', { size: diff.length });
            } catch (err) {
                console.error('[Action] Compare with Local failed', { error: err });
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setIsLoading(false);
            }
        };

        loadDiff();
    }, [isOpen, commit.hash]);

    // Parse diff into file items
    const { files, parseError } = useMemo(() => {
        if (!diffText) return { files: [], parseError: null };

        try {
            const parsedFiles = parseDiff(diffText);
            const items: FileItem[] = parsedFiles.map((file, index) => {
                const newPath = normalizePath(file.newPath);
                const oldPath = normalizePath(file.oldPath);
                const filePath =
                    (newPath && newPath !== '/dev/null' ? newPath : '') ||
                    (oldPath && oldPath !== '/dev/null' ? oldPath : '');
                const { added, deleted } = getAddedDeletedCounts(file);

                return {
                    id: `${index}:${filePath}`,
                    file,
                    filePath,
                    label: getFileLabel(file),
                    added,
                    deleted,
                    status: getFileStatus(file),
                };
            });
            return { files: items, parseError: null };
        } catch (err) {
            return { files: [], parseError: err instanceof Error ? err.message : String(err) };
        }
    }, [diffText]);

    // Auto-select first file
    useEffect(() => {
        if (files.length > 0 && !selectedFile) {
            setSelectedFile(files[0].id);
        }
    }, [files, selectedFile]);

    const selectedFileItem = files.find((f) => f.id === selectedFile);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const statusBadge = (status: 'modified' | 'added' | 'deleted') => {
        switch (status) {
            case 'added':
                return <Badge variant="success">A</Badge>;
            case 'deleted':
                return <Badge variant="danger">D</Badge>;
            case 'modified':
            default:
                return <Badge variant="warning">M</Badge>;
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col bg-surface1">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border1 bg-surface2 px-6 py-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 !px-0"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold text-text1">Compare with Local</h1>
                        <p className="text-sm text-text3">
                            <span className="text-highlight font-mono">{shortHash}</span>
                            <span className="mx-2">→</span>
                            <span className="text-primary font-mono">HEAD</span>
                        </p>
                    </div>
                </div>
                <div className="text-sm text-text3">
                    {files.length} file{files.length !== 1 ? 's' : ''} changed
                </div>
            </div>

            {/* Main Content */}
            <div className="flex min-h-0 flex-1">
                {/* Left Panel - File List */}
                <div className="w-72 shrink-0 overflow-auto border-r border-border1 bg-surface2">
                    <div className="px-4 py-3 text-xs font-semibold uppercase text-text3">
                        Changed Files ({files.length})
                    </div>

                    {isLoading && (
                        <div className="px-4 py-8 text-center text-sm text-text3">
                            Loading diff...
                        </div>
                    )}

                    {error && (
                        <div className="px-4 py-4 text-sm text-danger">
                            Error: {error}
                        </div>
                    )}

                    {parseError && (
                        <div className="px-4 py-4 text-sm text-danger">
                            Parse error: {parseError}
                        </div>
                    )}

                    {!isLoading && !error && files.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-text3">
                            No changes found
                        </div>
                    )}

                    {files.map((file) => (
                        <button
                            key={file.id}
                            type="button"
                            onClick={() => setSelectedFile(file.id)}
                            className={`w-full px-4 py-2 text-left transition-colors cursor-pointer ${selectedFile === file.id
                                ? 'bg-highlight/15 text-text1'
                                : 'text-text2 hover:bg-surface3'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {statusBadge(file.status)}
                                <span className="truncate text-sm">{file.label}</span>
                            </div>
                            <div className="mt-1 text-xs text-text3 font-mono">
                                <span className="text-success">+{file.added}</span>
                                {' '}
                                <span className="text-danger">-{file.deleted}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Right Panel - Diff Viewer */}
                <div className="min-w-0 flex-1 overflow-auto bg-[rgb(8,8,12)]">
                    {selectedFileItem ? (
                        <div className="diff-viewer p-4">
                            <div className="mb-4 flex items-center gap-3">
                                {statusBadge(selectedFileItem.status)}
                                <span className="text-sm font-medium text-text1">
                                    {selectedFileItem.label}
                                </span>
                                <span className="text-xs text-text3 font-mono">
                                    <span className="text-success">+{selectedFileItem.added}</span>
                                    {' '}
                                    <span className="text-danger">-{selectedFileItem.deleted}</span>
                                </span>
                            </div>

                            {selectedFileItem.file.isBinary ? (
                                <div className="text-sm text-text3">
                                    Binary file diff not supported.
                                </div>
                            ) : (
                                <Diff
                                    viewType="unified"
                                    diffType={selectedFileItem.file.type}
                                    hunks={selectedFileItem.file.hunks}
                                >
                                    {(hunks) =>
                                        hunks.map((hunk) => (
                                            <Hunk key={hunk.content} hunk={hunk} />
                                        ))
                                    }
                                </Diff>
                            )}
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-text3">
                            Select a file to view diff
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
