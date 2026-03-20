import type { StixCategory } from '../types/stix';
import { CATEGORY_COLORS } from '../types/stix';

interface FilterBarProps {
  activeCategories: Set<StixCategory>;
  onToggleCategory: (category: StixCategory) => void;
  counts: Record<StixCategory, number>;
}

const chips: { category: StixCategory; label: string }[] = [
  { category: 'sdo', label: 'SDO' },
  { category: 'sro', label: 'SRO' },
  { category: 'sco', label: 'SCO' },
  { category: 'meta', label: 'Meta' },
];

export default function FilterBar({ activeCategories, onToggleCategory, counts }: FilterBarProps) {
  return (
    <div className="flex gap-2 px-6 py-3">
      {chips.map(({ category, label }) => {
        const active = activeCategories.has(category);
        return (
          <button
            key={category}
            onClick={() => onToggleCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
              active ? 'opacity-100' : 'opacity-40'
            }`}
            style={{
              borderColor: CATEGORY_COLORS[category],
              color: CATEGORY_COLORS[category],
              backgroundColor: active ? `${CATEGORY_COLORS[category]}15` : 'transparent',
            }}
          >
            {label} ({counts[category]})
          </button>
        );
      })}
    </div>
  );
}
