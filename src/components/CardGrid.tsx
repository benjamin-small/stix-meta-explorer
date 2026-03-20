import type { StixObjectType, StixCategory } from '../types/stix';
import { CATEGORY_COLORS } from '../types/stix';
import ObjectCard from './ObjectCard';

interface CardGridProps {
  objects: StixObjectType[];
  onSelectObject: (obj: StixObjectType) => void;
}

const SECTION_ORDER: { category: StixCategory; label: string }[] = [
  { category: 'sdo', label: 'Domain Objects' },
  { category: 'sro', label: 'Relationship Objects' },
  { category: 'sco', label: 'Cyber Observables' },
  { category: 'meta', label: 'Meta Objects' },
];

export default function CardGrid({ objects, onSelectObject }: CardGridProps) {
  const grouped = SECTION_ORDER.map(({ category, label }) => ({
    category,
    label,
    items: objects.filter((o) => o.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="px-6 pb-6 space-y-6">
      {grouped.map(({ category, label, items }) => (
        <section key={category}>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: CATEGORY_COLORS[category] }}
          >
            {label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map((obj) => (
              <ObjectCard
                key={obj.type}
                object={obj}
                onClick={() => onSelectObject(obj)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
