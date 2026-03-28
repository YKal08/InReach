import { useState } from "react";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  location: string;
  phone: string;
  email: string;
  bio: string;
  availability: string;
  image: string;
  lat: number;
  lng: number;
  distance?: number;
}

interface DoctorDetailModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onSendRequest: (doctorId: number, notes: string) => void;
  requestSent: boolean;
  isSending?: boolean;
  error?: string | null;
}

export default function DoctorDetailModal({ doctor, isOpen, onClose, onSendRequest, requestSent, isSending = false, error = null }: DoctorDetailModalProps) {
  const [notes, setNotes] = useState("");

  if (!isOpen || !doctor) return null;

  const handleSend = () => {
    onSendRequest(doctor.id, notes);
    setNotes("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] overflow-hidden border border-gray-200 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="relative h-32 bg-gradient-to-r from-[var(--clr-primary)] to-[var(--clr-nav)]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors text-base"
          >
            ×
          </button>
          <div className="absolute -bottom-8 left-6">
            <div className="w-16 h-16 rounded-xl border-4 border-white overflow-hidden shadow-md">
              <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="pt-12 pb-6 px-6 overflow-y-auto max-h-[80vh]">
          {/* Name + specialty + distance */}
          <div className="flex justify-between items-start mb-1">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{doctor.name}</h2>
            {doctor.distance !== undefined && (
              <span className="text-xs font-bold text-[var(--clr-accent-muted)] bg-[var(--clr-accent-light)] px-2 py-1 rounded-lg ml-3 shrink-0">
                {doctor.distance.toFixed(1)} км
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-[var(--clr-primary)] uppercase tracking-wider mb-4">{doctor.specialty}</p>

          {/* Bio */}
          <p className="text-sm text-gray-600 leading-relaxed mb-5">{doctor.bio}</p>

          {/* Info rows */}
          <div className="space-y-2 mb-5">
            <InfoRow icon="location" value={doctor.location} />
            <InfoRow icon="clock" value={doctor.availability} />
            <InfoRow icon="phone" value={doctor.phone} />
            <InfoRow icon="email" value={doctor.email} />
          </div>

          {/* Notes box */}
          {!requestSent && (
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Бележки за лекаря <span className="font-normal normal-case">(по избор)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Опишете ситуацията, симптомите или друга важна информация..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {requestSent ? (
              <div className="flex-1 py-3 text-center bg-[var(--clr-success-bg)] border border-[var(--clr-accent)] text-[var(--clr-nav)] text-sm font-semibold rounded-lg">
                Заявката е изпратена
              </div>
            ) : (
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 py-3 bg-[var(--clr-primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--clr-primary-hover)] transition-colors duration-200 active:bg-[var(--clr-primary)]"
              >
                {isSending ? "Изпращане..." : "Изпрати заявка за посещение"}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-3 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              Затвори
            </button>
          </div>
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, value }: { icon: string; value: string }) {
  const paths: Record<string, string> = {
    location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    email: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  };
  return (
    <div className="flex items-center gap-2.5 text-sm text-gray-600">
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d={paths[icon]} />
      </svg>
      <span>{value}</span>
    </div>
  );
}
