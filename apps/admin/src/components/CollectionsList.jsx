export default function CollectionsList({ collections }) {
  if (!collections || collections.length === 0) {
    return <span className="text-muted">No collections</span>;
  }

  return (
    <ul className="collections-list">
      {collections.map((col) => (
        <li key={col.id}>
          <span className="collection-name">{col.name}</span>
          <span className="collection-date">
            {new Date(col.savedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
