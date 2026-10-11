import { shapeGroups } from './graph-shapes';

export default function ShapeLegend() {
  return <details className="case-shape-key">
    <summary>Object shapes <span aria-hidden="true">● ■ ◆</span></summary>
    <ul>{shapeGroups.map(group => <li key={group.shape}>
      <i className={`case-shape ${group.shape}`} aria-hidden="true" />
      <div><strong>{group.label} <small>({group.shape})</small></strong><p>{group.types.join(', ')}</p></div>
    </li>)}</ul>
    <p>Shapes group related STIX types. Select an object for its exact type; relationships are connections.</p>
  </details>;
}
