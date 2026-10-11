import { useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { hackersById, labelOf } from '../../data/hackers';
import { useGraphObjectCard } from './useGraphObjectCard';
import './graph-object-card.css';

export default function GraphObjectCard({ preview, keepOpen, leave, dismiss }: ReturnType<typeof useGraphObjectCard>) {
  const card = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    if (!preview || !card.current) return;
    const rect = card.current.getBoundingClientRect();
    const left = preview.x + 16 + rect.width > window.innerWidth - 12 ? preview.x - rect.width - 16 : preview.x + 16;
    card.current.style.left = `${Math.max(12, Math.min(left, window.innerWidth - rect.width - 12))}px`;
    card.current.style.top = `${Math.max(12, Math.min(preview.y + 12, window.innerHeight - rect.height - 12))}px`;
  }, [preview]);
  const object = preview && hackersById.get(preview.id);
  if (!object) return null;
  const description = object.description ?? object.content ?? object.explanation;
  const aliases = Array.isArray(object.aliases) ? object.aliases.join(' · ') : null;
  return createPortal(<div ref={card} className="graph-object-card" role="dialog" aria-modal="false" aria-labelledby={titleId}
    onPointerEnter={keepOpen} onPointerLeave={leave} onFocusCapture={keepOpen}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) leave(); }}>
    <div className="graph-object-card-top"><span>{object.type}</span><button aria-label="Close object preview" onClick={dismiss}>×</button></div>
    <h3 id={titleId}>{labelOf(object)}</h3>
    {aliases && <p className="graph-object-aliases">{aliases}</p>}
    <p className="graph-object-description">{typeof description === 'string' ? description : 'No description is provided for this object in the teaching dataset.'}</p>
    <dl>
      {typeof object.value === 'string' && <><dt>Value</dt><dd>{object.value}</dd></>}
      {typeof object.first_observed === 'string' && <><dt>First observed · synthetic</dt><dd>{object.first_observed}</dd></>}
      <dt>STIX ID</dt><dd className="graph-object-id">{object.id}</dd>
    </dl>
  </div>, document.body);
}
