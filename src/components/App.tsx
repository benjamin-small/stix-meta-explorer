import { useMemo } from 'react';
import TopBar from './TopBar';
import FilterBar from './FilterBar';
import CardGrid from './CardGrid';
import DetailDrawer from './DetailDrawer';
import { useFilter } from '../hooks/useFilter';
import { useUrlType } from '../hooks/useUrlType';
import { stixObjects } from '../data';
import type { StixCategory } from '../types/stix';

export default function App() {
  const { filteredObjects, activeCategories, toggleCategory, search, setSearch } = useFilter();
  const { selectedObject, setSelectedObject } = useUrlType();
  const counts = useMemo(() => {
    const c = { sdo: 0, sro: 0, sco: 0, meta: 0 } as Record<StixCategory, number>;
    for (const obj of stixObjects) c[obj.category]++;
    return c;
  }, []);

  return (
    <div className="min-h-screen bg-cti-bg">
      <TopBar search={search} onSearchChange={setSearch} />
      <FilterBar activeCategories={activeCategories} onToggleCategory={toggleCategory} counts={counts} />
      <CardGrid objects={filteredObjects} onSelectObject={setSelectedObject} />
      <DetailDrawer object={selectedObject} onClose={() => setSelectedObject(null)} />
    </div>
  );
}
