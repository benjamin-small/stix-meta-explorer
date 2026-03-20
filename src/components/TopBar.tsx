interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function TopBar({ search, onSearchChange }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 bg-cti-bg/95 backdrop-blur border-b border-cti-border px-6 py-4 flex items-center justify-between gap-4">
      <h1 className="text-xl font-bold text-cti-text whitespace-nowrap">
        STIX 2.1 Meta Explorer
      </h1>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search objects..."
        className="bg-cti-surface border border-cti-border rounded-lg px-4 py-2 text-cti-text placeholder-cti-muted focus:outline-none focus:border-cti-sco w-full max-w-md"
      />
    </header>
  );
}
