import { useEffect } from 'react';

/**
 * Lightbox image produit — fermeture croix / backdrop / Escape.
 */
export default function ImageLightbox({ src, alt = 'Photo produit', onClose }) {
  useEffect(() => {
    if (!src) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'rgba(28,28,28,.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 44,
          height: 44,
          border: 'none',
          borderRadius: '50%',
          background: '#F7F5F2',
          color: '#3A2E25',
          fontSize: '1.4rem',
          cursor: 'pointer',
          zIndex: 1,
        }}
      >
        ×
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        onError={(e) => {
          e.currentTarget.src =
            'data:image/svg+xml;charset=utf-8,' +
            encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#E6DCCB" width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" fill="#3A2E25" font-family="sans-serif">Image indisponible</text></svg>`
            );
        }}
        style={{
          maxWidth: 'min(960px, 100%)',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: 8,
          background: '#F7F5F2',
        }}
      />
    </div>
  );
}
