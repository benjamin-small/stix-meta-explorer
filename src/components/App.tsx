import { lazy, Suspense } from 'react';
const HackersExplorer = lazy(() => import('../features/hackers/HackersExplorer'));
import { useMemo } from 'react';
import TopBar from './TopBar';
import FilterBar from './FilterBar';
import CardGrid from './CardGrid';
import DetailDrawer from './DetailDrawer';
import { useFilter } from '../hooks/useFilter';
import { useUrlType } from '../hooks/useUrlType';
import { stixObjects } from '../data';
import type { StixCategory } from '../types/stix';
import AgentGate from '../features/stix-agent/AgentGate';

export default function App() {
  const { filteredObjects, activeCategories, toggleCategory, search, setSearch } = useFilter();
  const { selectedObject, setSelectedObject } = useUrlType();
  const counts = useMemo(() => {
    const c = { sdo: 0, sro: 0, sco: 0, meta: 0 } as Record<StixCategory, number>;
    for (const obj of stixObjects) c[obj.category]++;
    return c;
  }, []);

  if (new URLSearchParams(window.location.search).get('view') === 'hackers') return <Suspense fallback={<p className="p-6">Loading example bundle…</p>}><HackersExplorer /></Suspense>;

  return (
    <div className="min-h-screen bg-cti-bg">
      <TopBar search={search} onSearchChange={setSearch} />
      <nav className="px-6 py-3"><a className="text-cti-sco hover:underline" href="?view=hackers">Explore the Hackers (1995) example bundle →</a></nav>
      <FilterBar activeCategories={activeCategories} onToggleCategory={toggleCategory} counts={counts} />
      <CardGrid objects={filteredObjects} onSelectObject={setSelectedObject} />
      <DetailDrawer object={selectedObject} onClose={() => setSelectedObject(null)} />
      <AgentGate selectedType={selectedObject?.type} />
    </div>
  );
}
