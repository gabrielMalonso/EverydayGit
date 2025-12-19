import React from 'react';
import { TopBar } from './components/TopBar';
import { BranchesPanel } from './components/BranchesPanel';
import { ChangesPanel } from './components/ChangesPanel';
import { DiffViewer } from './components/DiffViewer';
import { AiPanel } from './components/AiPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsModal } from './components/SettingsModal';

function App() {
  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <TopBar />

      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left Column - Branches */}
        <div className="w-64 flex-shrink-0">
          <BranchesPanel />
        </div>

        {/* Center Column - Changes + Diff */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex-1 min-h-0">
            <ChangesPanel />
          </div>
          <div className="h-96 min-h-0">
            <DiffViewer />
          </div>
        </div>

        {/* Right Column - AI */}
        <div className="w-80 flex-shrink-0">
          <AiPanel />
        </div>
      </div>

      {/* Bottom Row - History */}
      <div className="h-64 border-t border-border p-4">
        <HistoryPanel />
      </div>

      <SettingsModal />
    </div>
  );
}

export default App;
