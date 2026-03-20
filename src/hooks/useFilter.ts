import { useState, useMemo } from 'react';
import { stixObjects } from '../data';
import type { StixCategory } from '../types/stix';

export function useFilter() {
  const [activeCategories, setActiveCategories] = useState<Set<StixCategory>>(
    new Set(['sdo', 'sro', 'sco', 'meta'])
  );
  const [search, setSearch] = useState('');

  const toggleCategory = (category: StixCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredObjects = useMemo(() => {
    const query = search.toLowerCase().trim();
    return stixObjects.filter((obj) => {
      if (!activeCategories.has(obj.category)) return false;
      if (query) {
        return (
          obj.name.toLowerCase().includes(query) ||
          obj.description.toLowerCase().includes(query) ||
          obj.type.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [activeCategories, search]);

  return {
    filteredObjects,
    activeCategories,
    toggleCategory,
    search,
    setSearch,
  };
}
