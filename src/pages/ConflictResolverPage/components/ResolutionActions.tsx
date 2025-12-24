import React from 'react';
import { Button } from '@/ui';

interface Props {
  onAcceptOurs: () => void;
  onAcceptTheirs: () => void;
  onAcceptBoth: () => void;
}

export const ResolutionActions: React.FC<Props> = ({
  onAcceptOurs,
  onAcceptTheirs,
  onAcceptBoth,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-md border border-border1 bg-surface2 p-4">
      <Button variant="secondary" size="md" onClick={onAcceptOurs} className="min-w-32">
        Aceitar Atual
      </Button>

      <Button variant="secondary" size="md" onClick={onAcceptTheirs} className="min-w-32">
        Aceitar Entrando
      </Button>

      <Button variant="secondary" size="md" onClick={onAcceptBoth} className="min-w-32">
        Aceitar Ambos
      </Button>
    </div>
  );
};
