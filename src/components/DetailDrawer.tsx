import { useEffect } from 'react';
import type { StixObjectType } from '../types/stix';
import ObjectDetail from './ObjectDetail';

interface DetailDrawerProps {
  object: StixObjectType | null;
  onClose: () => void;
}

export default function DetailDrawer({ object, onClose }: DetailDrawerProps) {
  useEffect(() => {
    if (!object) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [object, onClose]);

  if (!object) return null;

  return (
    <>
      <div
        data-testid="drawer-overlay"
        className="fixed inset-0 bg-black/60 z-20"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full md:w-3/5 bg-cti-surface border-l border-cti-border z-30 overflow-y-auto shadow-2xl animate-slide-in">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-cti-muted hover:text-cti-text text-xl z-10"
        >
          ✕
        </button>
        <ObjectDetail object={object} />
      </div>
    </>
  );
}
