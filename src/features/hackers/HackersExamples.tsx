import { hackersObjects, labelOf, objectHref } from '../../data/hackers';
import JsonExample from '../../components/JsonExample';
export default function HackersExamples({ type }: { type: string }) {
  const objects = hackersObjects.filter(o => o.type === type);
  return <section><h3 className="text-sm font-semibold text-cti-muted uppercase tracking-wider mb-3">Hackers (1995) examples</h3>
    {objects.length ? objects.map(o => <details key={o.id} className="mb-3"><summary>{labelOf(o)}</summary><a href={objectHref(o.id)} className="inline-block text-sm text-cti-sco my-2">Explore this instance and its connections →</a><JsonExample data={o} /></details>) : <p className="text-sm text-cti-muted">This dataset has no {type} instances. The generic example above illustrates this type.</p>}
  </section>;
}
