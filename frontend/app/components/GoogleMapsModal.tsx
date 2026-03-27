interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Full Google Maps embed iframe URL */
  embedUrl: string;
  /** Clickable link to open in native Google Maps app/tab */
  externalUrl: string;
  title: string;
}

export default function GoogleMapsModal({ isOpen, onClose, embedUrl, externalUrl, title }: GoogleMapsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Navigation</p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-[var(--clr-primary)] hover:text-[var(--clr-primary-hover)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Google Maps
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Map iframe */}
        <div className="flex-1 min-h-0" style={{ height: "600px" }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={title}
          />
        </div>
      </div>
    </div>
  );
}
