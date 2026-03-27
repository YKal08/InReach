import type { Route } from "./+types/doctors";
import Navbar from "../components/Navbar";
import { useEasyMode } from "../components/EasyModeContext";
import { useState, useMemo, useEffect } from "react";
import { calculateDistance } from "../utils/distance";
import DoctorDetailModal from "../components/DoctorDetailModal";

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

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Meet Our Specialists - InReach" },
    { name: "description", content: "Browse our network of healthcare professionals" },
  ];
}

const ALL_DOCTORS: Doctor[] = [
  { id: 1, name: "Dr. Maria Ivanova", specialty: "General Medicine", location: "Sofia", phone: "+359 (2) 123-4567", email: "maria.ivanova@inreach.bg", bio: "Experienced general practitioner with a passion for preventive care and patient education.", availability: "Mon-Fri, 9AM-5PM", image: "https://ui-avatars.com/api/?name=Maria+Ivanova&background=4a4699&color=fff&bold=true&size=200", lat: 42.6977, lng: 23.3219 },
  { id: 2, name: "Dr. Alexander Petrov", specialty: "Cardiology", location: "Plovdiv", phone: "+359 (32) 234-5678", email: "alex.petrov@inreach.bg", bio: "Specializing in cardiovascular diseases with advanced diagnostic expertise.", availability: "Tue-Sat, 10AM-6PM", image: "https://ui-avatars.com/api/?name=Alexander+Petrov&background=4a4699&color=fff&bold=true&size=200", lat: 42.1354, lng: 24.7453 },
  { id: 3, name: "Dr. Elena Georgieva", specialty: "Pediatrics", location: "Varna", phone: "+359 (52) 345-6789", email: "elena.georgieva@inreach.bg", bio: "Child health specialist dedicated to providing compassionate pediatric care.", availability: "Mon-Thu, 8AM-4PM", image: "https://ui-avatars.com/api/?name=Elena+Georgieva&background=4a4699&color=fff&bold=true&size=200", lat: 43.2141, lng: 27.9147 },
  { id: 4, name: "Dr. Ivan Dimitrov", specialty: "Orthopedics", location: "Burgas", phone: "+359 (56) 456-7890", email: "ivan.dimitrov@inreach.bg", bio: "Expert in bone and joint conditions with surgical and non-surgical treatment options.", availability: "Wed-Sun, 11AM-7PM", image: "https://ui-avatars.com/api/?name=Ivan+Dimitrov&background=4a4699&color=fff&bold=true&size=200", lat: 42.5048, lng: 27.4626 },
  { id: 5, name: "Dr. Sofia Nikolova", specialty: "Dermatology", location: "Sofia", phone: "+359 (2) 567-8901", email: "sofia.nikolova@inreach.bg", bio: "Skin health specialist providing diagnostic and therapeutic dermatological services.", availability: "Tue-Sat, 9AM-5PM", image: "https://ui-avatars.com/api/?name=Sofia+Nikolova&background=4a4699&color=fff&bold=true&size=200", lat: 42.6977, lng: 23.3219 },
  { id: 6, name: "Dr. Yorgos Papadopoulos", specialty: "Neurology", location: "Plovdiv", phone: "+359 (32) 678-9012", email: "yorgos.papadopoulos@inreach.bg", bio: "Neurological disorders specialist with comprehensive diagnostic and treatment expertise.", availability: "Mon, Wed, Fri, 9AM-3PM", image: "https://ui-avatars.com/api/?name=Yorgos+Papadopoulos&background=4a4699&color=fff&bold=true&size=200", lat: 42.1354, lng: 24.7453 },
];

export default function Doctors() {
  const { isEasyMode } = useEasyMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(200);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "default">("loading");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestSentIds, setRequestSentIds] = useState<number[]>([]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationStatus("granted");
        },
        () => {
          setUserLocation({ lat: 42.6977, lng: 23.3219 });
          setLocationStatus("default");
        }
      );
    } else {
      setUserLocation({ lat: 42.6977, lng: 23.3219 });
      setLocationStatus("default");
    }
  }, []);

  const doctorsWithDistance = useMemo(() => {
    if (!userLocation) return ALL_DOCTORS;
    return ALL_DOCTORS.map((d) => ({
      ...d,
      distance: calculateDistance(userLocation.lat, userLocation.lng, d.lat, d.lng),
    }));
  }, [userLocation]);

  const specialties = Array.from(new Set(ALL_DOCTORS.map((d) => d.specialty))).sort();
  const locations = Array.from(new Set(ALL_DOCTORS.map((d) => d.location))).sort();

  const filteredDoctors = useMemo(() => {
    return doctorsWithDistance
      .filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialty = !selectedSpecialty || d.specialty === selectedSpecialty;
        const matchesLocation = !selectedLocation || d.location === selectedLocation;
        const matchesDistance = d.distance === undefined || d.distance <= maxDistance;
        return matchesSearch && matchesSpecialty && matchesLocation && matchesDistance;
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [searchQuery, selectedSpecialty, selectedLocation, doctorsWithDistance, maxDistance]);

  const handleOpenDoctor = (doctor: Doctor) => { setSelectedDoctor(doctor); setIsModalOpen(true); };
  const handleSendRequest = (doctorId: number, notes: string) => { setRequestSentIds((prev) => [...prev, doctorId]); };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className={isEasyMode ? "em-page" : "max-w-7xl mx-auto px-4 py-4"}>
        <div className="mb-6 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-2 animate-slide-in-down">Meet Our Specialists</h1>
          <p className="text-lg text-gray-600 animate-slide-in-up [animation-delay:100ms]">
            Browse our network of dedicated healthcare professionals.
          </p>
          {locationStatus !== "loading" && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
              <svg className={`w-3 h-3 ${locationStatus === "granted" ? "text-green-500" : "text-amber-500"}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {locationStatus === "granted" ? "Your location" : "Sofia (default)"} · within <strong className="ml-0.5">{maxDistance} km</strong>
            </p>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-4 relative animate-slide-in-up [animation-delay:200ms]">
          <div className="bg-white rounded border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 px-3 py-2">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
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
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition flex items-center gap-1 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
            </div>

            {showFilters && (
              <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 p-5 animate-scale-in grid gap-5 ${isEasyMode ? "grid-cols-2" : "grid-cols-3"}`}>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Specialty</label>
                  <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-(--clr-accent) bg-white text-xs">
                    <option value="">All Specialties</option>
                    {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">City</label>
                  <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-(--clr-accent) bg-white text-xs">
                    <option value="">All Cities</option>
                    {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Max Distance: <strong>{maxDistance} km</strong></label>
                  <input type="range" min={10} max={500} step={10} value={maxDistance} onChange={(e) => setMaxDistance(parseInt(e.target.value))} className="w-full cursor-pointer accent-(--clr-primary)" />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>10 km</span><span>500 km</span></div>
                </div>
                <div className={`text-center pt-2 border-t border-gray-200 ${isEasyMode ? "col-span-2" : "col-span-3"}`}>
                  <button onClick={() => { setSelectedSpecialty(""); setSelectedLocation(""); setMaxDistance(200); }} className="text-xs text-(--clr-accent) hover:text-(--clr-accent-muted) font-semibold transition-all duration-200">
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {filteredDoctors.length > 0 ? (
          <>
            <p className="text-xs text-gray-400 opacity-60 mb-6 animate-fade-in">
              Found {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""} within {maxDistance} km
            </p>

            {isEasyMode ? (
              // EASY MODE: use em- classes, match rest of site
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
                          <span className="text-base font-bold text-(--clr-primary-hover) shrink-0 ml-4">{doctor.distance.toFixed(1)} km</span>
                        )}
                      </div>
                      <p className="inline-flex self-start px-3 py-1 rounded-full text-sm font-semibold bg-(--clr-accent-light) text-(--clr-primary-hover) mb-3 mt-1">{doctor.specialty}</p>
                      <p className="em-body text-gray-600 line-clamp-2" style={{ marginBottom: 0 }}>{doctor.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // NORMAL MODE: portrait grid
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
                          {doctor.distance.toFixed(1)} km
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col grow">
                      <h2 className="text-sm font-bold text-gray-900 mb-0.5 group-hover:text-(--clr-primary) transition-colors leading-tight">{doctor.name}</h2>
                      <p className="inline-flex self-start px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--clr-accent-light) text-(--clr-primary-hover) mb-2">{doctor.specialty}</p>
                      <p className="text-xs text-gray-600 grow leading-relaxed line-clamp-3">{doctor.bio}</p>
                      <div className="mt-3 w-full py-2 bg-gray-50 group-hover:bg-(--clr-primary) text-gray-500 group-hover:text-white text-[10px] font-bold text-center rounded-lg transition-all duration-200 uppercase tracking-wide">
                        View Profile
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md p-12 border border-gray-200 animate-scale-in">
            <p className="text-lg text-gray-600 mb-2">No doctors found within {maxDistance} km.</p>
            <p className="text-sm text-gray-400 mb-6">Try increasing the distance filter or clearing search filters.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedSpecialty(""); setSelectedLocation(""); setMaxDistance(500); }}
              className="px-6 py-2 bg-(--clr-primary) text-white rounded-lg font-semibold hover:bg-(--clr-primary-hover) transition-all duration-200"
            >
              Show All Doctors
            </button>
          </div>
        )}
      </div>

      <footer className="bg-gray-100 border-t border-gray-200 mt-20 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-black">
          <p>&copy; 2025 InReach. Bringing healthcare to remote areas.</p>
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
