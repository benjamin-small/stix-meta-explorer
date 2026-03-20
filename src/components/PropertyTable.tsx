import { useState } from 'react';
import type { Property } from '../types/stix';

interface PropertyTableProps {
  properties: Property[];
}

export default function PropertyTable({ properties }: PropertyTableProps) {
  const [showCommon, setShowCommon] = useState(false);

  const common = properties.filter((p) => p.isCommon);
  const unique = properties.filter((p) => !p.isCommon);

  const renderRow = (prop: Property) => (
    <tr key={prop.name} className="border-b border-cti-border">
      <td className="py-2 px-3 text-sm font-mono text-cti-text">
        {prop.isInteresting && <span className="text-yellow-400 mr-1">{'\u2605'}</span>}
        {prop.name}
      </td>
      <td className="py-2 px-3 text-xs font-mono text-cti-muted">{prop.type}</td>
      <td className="py-2 px-3 text-xs">
        {prop.required && (
          <span className="text-cti-sdo bg-cti-sdo/10 px-1.5 py-0.5 rounded text-xs">
            required
          </span>
        )}
      </td>
      <td className="py-2 px-3 text-xs text-cti-muted">{prop.description}</td>
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-cti-border">
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Name</th>
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Type</th>
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Req</th>
            <th className="py-2 px-3 text-xs font-semibold text-cti-muted uppercase">Description</th>
          </tr>
        </thead>
        <tbody>
          {unique.map(renderRow)}
        </tbody>
      </table>

      {common.length > 0 && (
        <button
          onClick={() => setShowCommon(!showCommon)}
          className="mt-3 text-xs text-cti-muted hover:text-cti-text transition-colors"
        >
          {showCommon ? '\u25BE' : '\u25B8'} {common.length} common properties
        </button>
      )}

      {showCommon && (
        <table className="w-full text-left mt-2">
          <tbody>{common.map(renderRow)}</tbody>
        </table>
      )}
    </div>
  );
}
