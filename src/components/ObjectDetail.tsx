import type { StixObjectType } from '../types/stix';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types/stix';
import PropertyTable from './PropertyTable';
import JsonExample from './JsonExample';
import RelationshipGraph from './RelationshipGraph';

interface ObjectDetailProps {
  object: StixObjectType;
}

export default function ObjectDetail({ object }: ObjectDetailProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-cti-text">{object.name}</h2>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{
              color: CATEGORY_COLORS[object.category],
              backgroundColor: `${CATEGORY_COLORS[object.category]}15`,
            }}
          >
            {CATEGORY_LABELS[object.category]}
          </span>
        </div>
        <code className="text-xs text-cti-muted font-mono">{object.type}</code>
      </div>

      {/* Description */}
      <p className="text-sm text-cti-text leading-relaxed">{object.description}</p>

      {/* Properties */}
      <div>
        <h3 className="text-sm font-semibold text-cti-muted uppercase tracking-wider mb-3">
          Properties
        </h3>
        <PropertyTable properties={object.properties} />
      </div>

      {/* Example */}
      {Object.keys(object.example).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-cti-muted uppercase tracking-wider mb-3">
            Example
          </h3>
          <JsonExample data={object.example} />
        </div>
      )}

      {/* Relationship Graph */}
      <div>
        <h3 className="text-sm font-semibold text-cti-muted uppercase tracking-wider mb-3">
          Relationships
        </h3>
        <RelationshipGraph object={object} />
      </div>

      {/* Spec Link */}
      <a
        href={object.specUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm text-cti-sco hover:underline"
      >
        View in STIX 2.1 Spec →
      </a>
    </div>
  );
}
