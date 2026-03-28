import type { Route } from "./+types/doctors";
import Navbar from "../components/Navbar";
import { useEasyMode } from "../components/EasyModeContext";
import { useState, useMemo, useEffect, useCallback } from "react";
import DoctorDetailModal from "../components/DoctorDetailModal";
import { useRoleGuard } from "../utils/useRoleGuard";
import { api } from "../utils/api";

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

interface DoctorApiResponse {
  egn: string;
  firstName: string;
  lastName: string;
  address: string;
  telephone: string;
  description: string;
  distanceKm: number;
}

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Нашите специалисти - InReach" },
    { name: "description", content: "Разгледайте нашата мрежа от здравни специалисти" },
  ];
}

const DEFAULT_SPECIALTY = "Лекар";
const DEFAULT_AVAILABILITY = "Няма наличен график";
const DEFAULT_EMAIL = "Няма публичен имейл";

function toDoctor(apiDoctor: DoctorApiResponse, index: number): Doctor {
  const name = `${apiDoctor.firstName ?? ""} ${apiDoctor.lastName ?? ""}`.trim() || "Неизвестен лекар";
  const avatarName = encodeURIComponent(name);

  return {
    id: index + 1,
    name,
    specialty: DEFAULT_SPECIALTY,
    location: apiDoctor.address || "Няма адрес",
    phone: apiDoctor.telephone || "Няма телефон",
    email: DEFAULT_EMAIL,
    bio: apiDoctor.description || "Няма описание",
    availability: DEFAULT_AVAILABILITY,
    image: `https://ui-avatars.com/api/?name=${avatarName}&background=4a4699&color=fff&bold=true&size=200`,
    lat: 0,
    lng: 0,
    distance: apiDoctor.distanceKm,
  };
}

export default function Doctors() {
  const { isEasyMode } = useEasyMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestSentIds, setRequestSentIds] = useState<number[]>([]);

  // Patient-only guard — redirects doctors to /doctor-home, guests to /login
  const { isLoading: authLoading } = useRoleGuard("PATIENT");

  const loadDoctors = useCallback(async () => {
    setIsDoctorsLoading(true);
    setDoctorsError(null);

    try {
      const doctors = await api.get<DoctorApiResponse[]>("/users/doctors/nearby");
      setAllDoctors(doctors.map(toDoctor));
    } catch (error) {
      console.error("Failed to load doctors:", error);
      setDoctorsError("Неуспешно зареждане на лекарите. Моля, опитайте отново.");
      setAllDoctors([]);
    } finally {
      setIsDoctorsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const doctorsWithDistance = useMemo(() => {
    return allDoctors;
  }, [allDoctors]);

  const specialties = Array.from(new Set(allDoctors.map((d) => d.specialty))).sort();
  const locations = Array.from(new Set(allDoctors.map((d) => d.location))).sort();

  const filteredDoctors = useMemo(() => {
    return doctorsWithDistance
      .filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialty = !selectedSpecialty || d.specialty === selectedSpecialty;
        const matchesLocation = !selectedLocation || d.location === selectedLocation;
        return matchesSearch && matchesSpecialty && matchesLocation;
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [searchQuery, selectedSpecialty, selectedLocation, doctorsWithDistance]);

  const handleOpenDoctor = (doctor: Doctor) => { setSelectedDoctor(doctor); setIsModalOpen(true); };
  const handleSendRequest = (doctorId: number) => { setRequestSentIds((prev) => [...prev, doctorId]); };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className={isEasyMode ? "em-page" : "max-w-7xl mx-auto px-4 py-4"}>
        <div className="mb-6 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-2 animate-slide-in-down">Нашите специалисти</h1>
          <p className="text-lg text-gray-600 animate-slide-in-up [animation-delay:100ms]">
            Разгледайте нашата мрежа от отдадени здравни специалисти.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Показват се лекари в радиус до 100 км според системата.
          </p>
          {doctorsError && <p className="text-xs text-red-500 mt-1">{doctorsError}</p>}
        </div>

        {/* ── EASY MODE: search + specialty filter always visible ── */}
        {isEasyMode ? (
          <div className="flex flex-col gap-3 animate-slide-in-up [animation-delay:200ms]">
            {/* Search bar */}
            <div className="em-card flex items-center gap-3" style={{ padding: "12px 20px" }}>
              <svg className="w-6 h-6 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Търсене по име или специалност…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="em-input border-0 focus:ring-0 flex-1"
                style={{ padding: "0", border: "none", boxShadow: "none" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 shrink-0" style={{ lineHeight: 0 }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            {/* Specialty filter — always visible in easy mode */}
            <div className="em-card" style={{ padding: "16px 20px" }}>
              <label className="em-label" style={{ fontSize: "16px", marginBottom: "8px" }}>Филтър по специалност</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSpecialty("")}
                  className={`px-4 py-2 rounded-full text-base font-semibold border-2 transition-colors ${!selectedSpecialty ? "bg-(--clr-primary) text-white border-(--clr-primary)" : "border-(--clr-accent) text-(--clr-nav) hover:border-(--clr-primary)"}`}
                >
                  Всички
                </button>
                {specialties.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSpecialty(selectedSpecialty === s ? "" : s)}
                    className={`px-4 py-2 rounded-full text-base font-semibold border-2 transition-colors ${selectedSpecialty === s ? "bg-(--clr-primary) text-white border-(--clr-primary)" : "border-(--clr-accent) text-(--clr-nav) hover:border-(--clr-primary)"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── NORMAL MODE: combined search + filter dropdown ── */
          <div className="mb-4 relative animate-slide-in-up [animation-delay:200ms]">
            <div className="bg-white rounded border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 px-3 py-2">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Търсене на лекари по име или специалност..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-2 py-2 focus:outline-none text-sm text-gray-900 placeholder-gray-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="p-1 text-gray-400 hover:text-gray-600 transition">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded transition flex items-center gap-1 text-sm font-medium ${showFilters ? "bg-(--clr-accent-light) text-(--clr-primary)" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Филтри
                  {(selectedSpecialty || selectedLocation) && (
                    <span className="bg-(--clr-primary) text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">{[selectedSpecialty, selectedLocation].filter(Boolean).length}</span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 p-5 animate-scale-in grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Специалност</label>
                    <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-(--clr-accent) bg-white text-xs">
                      <option value="">Всички специалности</option>
                      {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Град</label>
                    <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-(--clr-accent) bg-white text-xs">
                      <option value="">Всички градове</option>
                      {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 text-center pt-2 border-t border-gray-200">
                    <button onClick={() => { setSelectedSpecialty(""); setSelectedLocation(""); }} className="text-xs text-(--clr-accent) hover:text-(--clr-accent-muted) font-semibold transition-all duration-200">
                      Изчисти филтрите
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {isDoctorsLoading ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md p-12 border border-gray-200 animate-scale-in">
            <p className="text-lg text-gray-600 mb-2">Зареждане на лекарите...</p>
          </div>
        ) : filteredDoctors.length > 0 ? (
          <>
            <p className="text-xs text-gray-400 opacity-60 mb-6 animate-fade-in">
              Намерени {filteredDoctors.length} лекар{filteredDoctors.length !== 1 ? "и" : ""}
            </p>

            {isEasyMode ? (
              <div className="flex flex-col gap-4">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="em-card flex flex-row overflow-hidden cursor-pointer"
                    style={{ padding: 0 }}
                    onClick={() => handleOpenDoctor(doctor)}
                  >
                    <div className="w-44 shrink-0 bg-linear-to-b from-(--clr-primary) to-(--clr-primary-hover) overflow-hidden">
                      <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 flex flex-col justify-center grow">
                      <div className="flex justify-between items-center mb-1">
                        <h2 className="em-subheading" style={{ marginBottom: 0 }}>{doctor.name}</h2>
                        {doctor.distance !== undefined && (
                          <span className="text-base font-bold text-(--clr-primary-hover) shrink-0 ml-4">{doctor.distance.toFixed(1)} км</span>
                        )}
                      </div>
                      <p className="inline-flex self-start px-3 py-1 rounded-full text-sm font-semibold bg-(--clr-accent-light) text-(--clr-primary-hover) mb-3 mt-1">{doctor.specialty}</p>
                      <p className="em-body text-gray-600 line-clamp-2" style={{ marginBottom: 0 }}>{doctor.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredDoctors.map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-(--clr-accent-light) overflow-hidden flex flex-col animate-slide-in-up cursor-pointer group"
                    style={{ animationDelay: `${index * 80}ms` }}
                    onClick={() => handleOpenDoctor(doctor)}
                  >
                    <div className="w-full aspect-square bg-linear-to-b from-(--clr-primary) to-(--clr-primary-hover) overflow-hidden shrink-0 relative">
                      <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {doctor.distance !== undefined && (
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-(--clr-primary-hover) shadow-sm">
                          {doctor.distance.toFixed(1)} км
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col grow">
                      <h2 className="text-sm font-bold text-gray-900 mb-0.5 group-hover:text-(--clr-primary) transition-colors leading-tight">{doctor.name}</h2>
                      <p className="inline-flex self-start px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--clr-accent-light) text-(--clr-primary-hover) mb-2">{doctor.specialty}</p>
                      <p className="text-xs text-gray-600 grow leading-relaxed line-clamp-3">{doctor.bio}</p>
                      <div className="mt-3 w-full py-2 bg-gray-50 group-hover:bg-(--clr-primary) text-gray-500 group-hover:text-white text-[10px] font-bold text-center rounded-lg transition-all duration-200 uppercase tracking-wide">
                        Виж профила
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md p-12 border border-gray-200 animate-scale-in">
            <p className="text-lg text-gray-600 mb-2">Не са намерени лекари{selectedSpecialty ? ` за ${selectedSpecialty}` : ""}.</p>
            <p className="text-sm text-gray-400 mb-6">Опитайте да изчистите филтрите.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { setSearchQuery(""); setSelectedSpecialty(""); setSelectedLocation(""); }}
                className="px-6 py-2 bg-(--clr-primary) text-white rounded-lg font-semibold hover:bg-(--clr-primary-hover) transition-all duration-200"
              >
                Покажи всички лекари
              </button>
              {doctorsError && (
                <button
                  onClick={loadDoctors}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Опитай отново
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="bg-gray-100 border-t border-gray-200 mt-20 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-black">
          <p>&copy; 2025 InReach. Доставяме здравна грижа в отдалечени райони.</p>
        </div>
      </footer>

      <DoctorDetailModal
        doctor={selectedDoctor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSendRequest={handleSendRequest}
        requestSent={selectedDoctor ? requestSentIds.includes(selectedDoctor.id) : false}
      />
    </div>
  );
}
