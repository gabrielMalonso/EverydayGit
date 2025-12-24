import React from 'react';
import { Panel } from '@/components/Panel';
import { Button } from '@/ui';
import { Save } from 'lucide-react';

interface Props {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  canSave: boolean;
  disabled?: boolean;
  isSaving?: boolean;
}

export const ResolutionPreview: React.FC<Props> = ({
  content,
  onChange,
  onSave,
  canSave,
  disabled = false,
  isSaving = false,
}) => {
  return (
    <Panel
      title="Resultado"
      actions={
        <Button size="sm" variant="primary" onClick={onSave} disabled={!canSave || disabled} isLoading={isSaving}>
          <Save size={14} />
          Salvar arquivo
        </Button>
      }
    >
      <div className="p-4">
        <textarea
          value={content}
          onChange={(event) => onChange(event.target.value)}
          className="h-48 w-full resize-none rounded-md border border-border1 bg-surface1 p-3 font-mono text-sm text-text1 focus:border-primary focus:outline-none"
          placeholder="O resultado da resolucao aparecera aqui..."
          disabled={disabled}
        />
      </div>
    </Panel>
  );
};
