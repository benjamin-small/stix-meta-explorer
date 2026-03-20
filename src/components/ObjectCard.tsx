import type { StixObjectType } from '../types/stix';
import { CATEGORY_COLORS } from '../types/stix';

interface ObjectCardProps {
  object: StixObjectType;
  onClick: () => void;
}

export default function ObjectCard({ object, onClick }: ObjectCardProps) {
  const totalRelationships =
    object.relationships.outgoing.length + object.relationships.incoming.length;

  return (
    <div
      onClick={onClick}
      className={`bg-cti-surface border border-cti-border border-l-4 rounded-lg p-4 cursor-pointer hover:bg-cti-surface-hover transition-colors`}
      style={{ borderLeftColor: CATEGORY_COLORS[object.category] }}
    >
      <h3 className="text-cti-text font-semibold text-sm">{object.name}</h3>
      <p className="text-cti-muted text-xs mt-1 line-clamp-2">{object.description}</p>
      {totalRelationships > 0 && (
        <span
          className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
          style={{
            color: CATEGORY_COLORS[object.category],
            backgroundColor: `${CATEGORY_COLORS[object.category]}15`,
          }}
        >
          {totalRelationships} relationship{totalRelationships !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
