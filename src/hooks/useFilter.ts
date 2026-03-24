import { useState, useMemo } from 'react';
import { stixObjects } from '../data';
import type { StixCategory } from '../types/stix';

export function useFilter() {
  const [activeCategories, setActiveCategories] = useState<Set<StixCategory>>(
    new Set()
  );
  const [search, setSearch] = useState('');

  const toggleCategory = (category: StixCategory) => {
    setActiveCategories((prev) => {
      if (prev.has(category)) {
        return new Set();
      }
      return new Set([category]);
    });
  };

  const filteredObjects = useMemo(() => {
    const query = search.toLowerCase().trim();
    return stixObjects.filter((obj) => {
      if (activeCategories.size > 0 && !activeCategories.has(obj.category)) return false;
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
