import { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options, selected, onChange, placeholder = 'Search...' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  const selectedItems = options.filter((o) => selected.includes(o.value));

  return (
    <div className="multiselect" ref={containerRef}>
      <div
        className={`multiselect__control${open ? ' multiselect__control--open' : ''}`}
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
      >
        {selectedItems.length === 0 && !open && (
          <span className="multiselect__placeholder">Select communities...</span>
        )}
        <div className="multiselect__tags">
          {selectedItems.map((item) => (
            <span key={item.value} className="multiselect__tag">
              {item.label}
              <button
                type="button"
                className="multiselect__tag-remove"
                onClick={(e) => { e.stopPropagation(); toggle(item.value); }}
              >
                ×
              </button>
            </span>
          ))}
          {open && (
            <input
              ref={inputRef}
              className="multiselect__input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={selectedItems.length === 0 ? placeholder : ''}
            />
          )}
        </div>
      </div>
      {open && (
        <div className="multiselect__dropdown">
          {filtered.length === 0 ? (
            <div className="multiselect__empty">No communities found</div>
          ) : (
            filtered.map((o) => (
              <label key={o.value} className="multiselect__option">
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={() => toggle(o.value)}
                />
                <span>{o.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
