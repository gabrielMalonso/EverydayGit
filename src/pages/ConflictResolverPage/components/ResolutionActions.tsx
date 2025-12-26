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
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="md"
        onClick={onAcceptOurs}
        className="min-w-32 border-infoFg/40 bg-infoBg text-infoFg hover:bg-infoFg/15"
      >
        Aceitar Atual
      </Button>

      <Button
        variant="secondary"
        size="md"
        onClick={onAcceptTheirs}
        className="min-w-32 border-warningFg/40 bg-warningBg text-warningFg hover:bg-warningFg/15"
      >
        Aceitar Entrando
      </Button>

      <Button
        variant="secondary"
        size="md"
        onClick={onAcceptBoth}
        className="min-w-32 border-successFg/40 bg-successBg text-successFg hover:bg-successFg/15"
      >
        Aceitar Ambos
      </Button>
    </div>
  );
};
