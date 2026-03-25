import { useState } from 'react';
import type { StixObjectType } from '../types/stix';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types/stix';
import PropertyTable from './PropertyTable';
import JsonExample from './JsonExample';
import RelationshipGraph from './RelationshipGraph';
import RelationshipTable from './RelationshipTable';

interface ObjectDetailProps {
  object: StixObjectType;
}

export default function ObjectDetail({ object }: ObjectDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
          <button
            onClick={handleCopyLink}
            title={copied ? 'Copied!' : 'Copy link'}
            className="p-1 rounded text-cti-muted hover:text-cti-text transition-colors"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-400">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
              </svg>
            )}
          </button>
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

      {/* Relationship Table */}
      <div>
        <h3 className="text-sm font-semibold text-cti-muted uppercase tracking-wider mb-3">
          Relationships
        </h3>
        <RelationshipTable relationships={object.relationships} objectType={object.type} relationshipNote={object.relationshipNote} />
      </div>

      {/* Relationship Graph */}
      <div>
        <h3 className="text-sm font-semibold text-cti-muted uppercase tracking-wider mb-3">
          Relationship Graph
        </h3>
        <RelationshipGraph object={object} relationshipNote={object.relationshipNote} />
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
