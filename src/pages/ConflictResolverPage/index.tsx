import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/ui';
import { useToastStore } from '@/stores/toastStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { ConflictFileList } from './components/ConflictFileList';
import { ConflictViewer } from './components/ConflictViewer';
import { ResolutionActions } from './components/ResolutionActions';
import { ResolutionPreview } from './components/ResolutionPreview';
import { useConflictFiles } from './hooks/useConflictFiles';
import { useConflictParser } from './hooks/useConflictParser';
import { useResolution } from './hooks/useResolution';

export const ConflictResolverPage: React.FC = () => {
  const { conflictFiles, isLoading } = useConflictFiles();
  const { conflictData, isLoading: isParsing, parseFile } = useConflictParser();
  const { resolutions, resolvedFiles, applyResolution, getResolvedContent, saveFile, completeMerge } = useResolution();
  const { showToast } = useToastStore();
  const { setPage } = useNavigationStore();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentHunkIndex, setCurrentHunkIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!selectedFile && conflictFiles.length > 0) {
      setSelectedFile(conflictFiles[0]);
      return;
    }

    if (selectedFile && !conflictFiles.includes(selectedFile)) {
      setSelectedFile(conflictFiles[0] ?? null);
    }
  }, [conflictFiles, selectedFile, isLoading]);

  useEffect(() => {
    if (!selectedFile) {
      setCurrentHunkIndex(0);
      return;
    }

    parseFile(selectedFile);
    setCurrentHunkIndex(0);
  }, [selectedFile, parseFile]);

  useEffect(() => {
    if (!conflictData) return;

    setCurrentHunkIndex((prev) => {
      if (conflictData.conflicts.length === 0) return 0;
      return Math.min(prev, conflictData.conflicts.length - 1);
    });
  }, [conflictData]);

  const currentHunk = conflictData?.conflicts[currentHunkIndex] ?? null;
  const totalHunks = conflictData?.conflicts.length ?? 0;

  const resolvedCount = useMemo(() => {
    return conflictFiles.filter((file) => resolvedFiles.has(file)).length;
  }, [conflictFiles, resolvedFiles]);

  const canComplete = conflictFiles.length > 0 && resolvedCount === conflictFiles.length;

  const currentFileResolutions = selectedFile ? resolutions.get(selectedFile) : undefined;
  const resolvedHunks = currentFileResolutions ? currentFileResolutions.size : 0;
  const allHunksResolved = totalHunks > 0 && resolvedHunks === totalHunks;

  const handleSaveFile = async () => {
    if (!selectedFile || !conflictData) return;

    setIsSaving(true);
    try {
      await saveFile(selectedFile, conflictData);
      showToast('Arquivo resolvido e adicionado ao stage!', 'success');
    } catch (error) {
      console.error('Failed to resolve conflict file:', error);
      showToast('Falha ao salvar resolucao', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteMerge = async () => {
    setIsCompleting(true);
    try {
      await completeMerge();
      showToast('Merge concluido com sucesso!', 'success');
      setPage('branches');
    } catch (error) {
      console.error('Failed to complete merge:', error);
      showToast('Erro ao finalizar merge', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  if (!isLoading && conflictFiles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-text2">Nenhum conflito para resolver.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => setPage('branches')}>
              Voltar para Branches
            </Button>
            <Button variant="primary" onClick={handleCompleteMerge} isLoading={isCompleting}>
              Finalizar merge
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-3 gap-4">
      <ConflictFileList
        files={conflictFiles}
        selectedFile={selectedFile}
        resolvedFiles={resolvedFiles}
        isLoading={isLoading}
        isCompleting={isCompleting}
        onSelectFile={setSelectedFile}
        onCompleteMerge={handleCompleteMerge}
        canComplete={canComplete && !isCompleting}
      />

      <div className="col-span-2 flex min-h-0 flex-col gap-4">
        {!selectedFile ? (
          <div className="flex h-full items-center justify-center text-text3">
            Selecione um arquivo para resolver conflitos.
          </div>
        ) : isParsing ? (
          <div className="flex h-full items-center justify-center text-text3">
            Carregando conflitos do arquivo...
          </div>
        ) : conflictData?.is_binary ? (
          <div className="flex h-full items-center justify-center rounded-card border border-border1 bg-surface1 p-6 text-center text-sm text-text2 shadow-card">
            Conflito binario detectado. Resolva manualmente no editor e volte para finalizar o merge.
          </div>
        ) : !currentHunk ? (
          <div className="flex h-full items-center justify-center rounded-card border border-border1 bg-surface1 p-6 text-center text-sm text-text2 shadow-card">
            Nenhum marcador de conflito encontrado para este arquivo.
          </div>
        ) : (
          <>
            <ConflictViewer
              hunk={currentHunk}
              currentIndex={currentHunkIndex}
              totalHunks={totalHunks}
              onPrevious={() => setCurrentHunkIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setCurrentHunkIndex((prev) => Math.min(totalHunks - 1, prev + 1))}
            />

            <div className="flex items-center justify-between text-xs text-text3">
              <span>
                Resolvido {resolvedHunks}/{totalHunks} neste arquivo
              </span>
              {allHunksResolved && <span className="text-success">Pronto para salvar</span>}
            </div>

            <ResolutionActions
              onAcceptOurs={() => applyResolution(selectedFile, currentHunk, 'ours')}
              onAcceptTheirs={() => applyResolution(selectedFile, currentHunk, 'theirs')}
              onAcceptBoth={() => applyResolution(selectedFile, currentHunk, 'both')}
            />

            <ResolutionPreview
              content={getResolvedContent(selectedFile, currentHunk.id)}
              onChange={(content) => applyResolution(selectedFile, currentHunk, 'custom', content)}
              onSave={handleSaveFile}
              canSave={allHunksResolved && !isSaving}
              isSaving={isSaving}
            />
          </>
        )}
      </div>
    </div>
  );
};
