import { useEffect } from 'react';

export default function Drawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <div
      className={`drawer-backdrop ${!open ? 'drawer-backdrop--closed' : ''}`}
      onClick={onClose}
    >
      <div
        className={`drawer-panel ${!open ? 'drawer-panel--closed' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
