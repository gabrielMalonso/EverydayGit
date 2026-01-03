import React from 'react';
import { ChangesListPanel } from './components/ChangesListPanel';
import { CommitPanel } from './components/CommitPanel';
import { DiffViewer } from './components/DiffViewer';
import { HistoryPanel } from './components/HistoryPanel';

export const CommitsPage: React.FC = React.memo(() => {
  return (
    <div className="grid h-full min-h-0 grid-cols-3 gap-4">
      <div className="col-span-1 flex min-h-0 flex-col gap-4">
        <ChangesListPanel className="min-h-0 flex-1" />
        <HistoryPanel className="min-h-0 flex-1" />
      </div>

      <div className="col-span-2 flex min-h-0 flex-col gap-4">
        <CommitPanel />
        <DiffViewer className="min-h-0 flex-1" />
      </div>
    </div>
  );
});

CommitsPage.displayName = 'CommitsPage';
