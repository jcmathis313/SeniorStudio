const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '12mo', days: 365 },
  { label: 'All', days: null },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function DateRangeFilter({ value, onChange }) {
  function selectPreset(days) {
    onChange({
      start: days ? daysAgo(days) : null,
      end: null,
      preset: days ? `${days}` : 'all',
    });
  }

  return (
    <div className="date-range-filter">
      {PRESETS.map((p) => (
        <button
          key={p.label}
          className={`date-range-btn${value.preset === (p.days ? `${p.days}` : 'all') ? ' date-range-btn--active' : ''}`}
          onClick={() => selectPreset(p.days)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
