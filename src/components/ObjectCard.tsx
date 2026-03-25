import type { StixObjectType } from '../types/stix';
import { CATEGORY_COLORS } from '../types/stix';

interface ObjectCardProps {
  object: StixObjectType;
  onClick: () => void;
}

export default function ObjectCard({ object, onClick }: ObjectCardProps) {
  const totalRelationships =
    object.relationships.outgoing.length + object.relationships.incoming.length;
  const totalTargets = new Set(
    [...object.relationships.outgoing, ...object.relationships.incoming]
      .flatMap((r) => r.objectTypes)
  ).size;

  return (
    <div
      onClick={onClick}
      className={`bg-cti-surface border border-cti-border border-l-4 rounded-lg p-4 cursor-pointer hover:bg-cti-surface-hover transition-colors`}
      style={{ borderLeftColor: CATEGORY_COLORS[object.category] }}
    >
      <h3 className="text-cti-text font-semibold text-sm">{object.name}</h3>
      <p className="text-cti-muted text-xs mt-1 line-clamp-2">{object.description}</p>
      {totalRelationships > 0 && (
        <div className="flex gap-2 mt-2">
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full"
            style={{ color: '#bc8cff', backgroundColor: '#bc8cff15' }}
          >
            {totalRelationships} relationship{totalRelationships !== 1 ? 's' : ''}
          </span>
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full"
            style={{ color: '#39d2c0', backgroundColor: '#39d2c015' }}
          >
            {totalTargets} target{totalTargets !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
