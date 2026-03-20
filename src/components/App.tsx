import { useState } from 'react';
import TopBar from './TopBar';
import FilterBar from './FilterBar';
import CardGrid from './CardGrid';
import DetailDrawer from './DetailDrawer';
import { useFilter } from '../hooks/useFilter';
import type { StixObjectType } from '../types/stix';

export default function App() {
  const { filteredObjects, activeCategories, toggleCategory, search, setSearch } = useFilter();
  const [selectedObject, setSelectedObject] = useState<StixObjectType | null>(null);

  return (
    <div className="min-h-screen bg-cti-bg">
      <TopBar search={search} onSearchChange={setSearch} />
      <FilterBar activeCategories={activeCategories} onToggleCategory={toggleCategory} />
      <CardGrid objects={filteredObjects} onSelectObject={setSelectedObject} />
      <DetailDrawer object={selectedObject} onClose={() => setSelectedObject(null)} />
    </div>
  );
}
