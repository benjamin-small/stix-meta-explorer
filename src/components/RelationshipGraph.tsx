import type { StixObjectType } from '../types/stix';

interface RelationshipGraphProps {
  object: StixObjectType;
}

export default function RelationshipGraph({ object }: RelationshipGraphProps) {
  const totalRelationships =
    object.relationships.outgoing.length + object.relationships.incoming.length;

  if (totalRelationships === 0) {
    return (
      <p className="text-sm text-cti-muted italic">
        No spec-defined relationships. Custom relationships may be defined via extensions.
      </p>
    );
  }

  return (
    <div className="bg-cti-bg border border-cti-border rounded-lg p-4 h-64 flex items-center justify-center">
      <p className="text-cti-muted text-sm">Graph placeholder — {totalRelationships} relationships</p>
    </div>
  );
}
