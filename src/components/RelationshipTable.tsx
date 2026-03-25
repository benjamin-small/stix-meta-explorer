import type { RelationshipDef } from '../types/stix';

interface RelationshipTableProps {
  relationships: {
    outgoing: RelationshipDef[];
    incoming: RelationshipDef[];
  };
  objectType: string;
  relationshipNote?: string;
}

export default function RelationshipTable({ relationships, objectType, relationshipNote }: RelationshipTableProps) {
  const { outgoing, incoming } = relationships;

  if (outgoing.length === 0 && incoming.length === 0) {
    return (
      <div className="rounded-lg border border-cti-border bg-cti-bg px-4 py-3">
        <p className="text-sm text-cti-muted">
          {relationshipNote ?? 'No spec-defined relationships. Custom relationships may be defined via extensions.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-cti-border">
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Direction</th>
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Relationship</th>
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Target Types</th>
          </tr>
        </thead>
        <tbody>
          {outgoing.map((rel) => (
            <tr key={`out-${rel.relationshipType}-${rel.objectTypes.join(',')}`} className="border-b border-cti-border">
              <td className="py-2 px-3 text-xs">
                <span className="text-cti-sdo bg-cti-sdo/10 px-1.5 py-0.5 rounded">outgoing</span>
              </td>
              <td className="py-2 px-3 text-sm font-mono text-cti-text">
                <span className="text-cti-muted">{objectType}</span>
                {' '}
                <span className="text-cti-sro">{rel.relationshipType}</span>
                {' '}
                <span className="text-cti-muted">→</span>
              </td>
              <td className="py-2 px-3 text-sm font-mono text-cti-text">
                {rel.objectTypes.map((t, i) => (
                  <span key={t}>
                    {i > 0 && <span className="text-cti-muted">, </span>}
                    {t}
                  </span>
                ))}
              </td>
            </tr>
          ))}
          {incoming.map((rel) => (
            <tr key={`in-${rel.relationshipType}-${rel.objectTypes.join(',')}`} className="border-b border-cti-border">
              <td className="py-2 px-3 text-xs">
                <span className="text-cti-sco bg-cti-sco/10 px-1.5 py-0.5 rounded">incoming</span>
              </td>
              <td className="py-2 px-3 text-sm font-mono text-cti-text">
                <span className="text-cti-muted">←</span>
                {' '}
                <span className="text-cti-sro">{rel.relationshipType}</span>
                {' '}
                <span className="text-cti-muted">{objectType}</span>
              </td>
              <td className="py-2 px-3 text-sm font-mono text-cti-text">
                {rel.objectTypes.map((t, i) => (
                  <span key={t}>
                    {i > 0 && <span className="text-cti-muted">, </span>}
                    {t}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
