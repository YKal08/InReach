import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { useEasyMode } from "../components/EasyModeContext";
import { useAuth } from "../components/AuthContext";
import { calculateDistance } from "../utils/distance";
import DoctorDetailModal from "../components/DoctorDetailModal";
import { useRoleGuard } from "../utils/useRoleGuard";

const MapComponent = lazy(() => import("../components/MapPicker"));

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

const ALL_DOCTORS: Doctor[] = [
  { id: 1, name: "Dr. Maria Ivanova",       specialty: "General Medicine", location: "Sofia",   phone: "+359 (2) 123-4567",   email: "maria.ivanova@inreach.bg",      bio: "Experienced general practitioner with a passion for preventive care and patient education.",          availability: "Mon-Fri, 9AM-5PM",       image: "https://ui-avatars.com/api/?name=Maria+Ivanova&background=4a4699&color=fff&bold=true&size=200",       lat: 42.6977, lng: 23.3219 },
  { id: 2, name: "Dr. Alexander Petrov",    specialty: "Cardiology",       location: "Plovdiv", phone: "+359 (32) 234-5678",  email: "alex.petrov@inreach.bg",        bio: "Specializing in cardiovascular diseases with advanced diagnostic expertise.",                          availability: "Tue-Sat, 10AM-6PM",      image: "https://ui-avatars.com/api/?name=Alexander+Petrov&background=4a4699&color=fff&bold=true&size=200",    lat: 42.1354, lng: 24.7453 },
  { id: 3, name: "Dr. Elena Georgieva",     specialty: "Pediatrics",       location: "Varna",   phone: "+359 (52) 345-6789",  email: "elena.georgieva@inreach.bg",    bio: "Child health specialist dedicated to providing compassionate pediatric care.",                          availability: "Mon-Thu, 8AM-4PM",       image: "https://ui-avatars.com/api/?name=Elena+Georgieva&background=4a4699&color=fff&bold=true&size=200",     lat: 43.2141, lng: 27.9147 },
  { id: 4, name: "Dr. Ivan Dimitrov",       specialty: "Orthopedics",      location: "Burgas",  phone: "+359 (56) 456-7890",  email: "ivan.dimitrov@inreach.bg",      bio: "Expert in bone and joint conditions with surgical and non-surgical treatment options.",                 availability: "Wed-Sun, 11AM-7PM",      image: "https://ui-avatars.com/api/?name=Ivan+Dimitrov&background=4a4699&color=fff&bold=true&size=200",      lat: 42.5048, lng: 27.4626 },
  { id: 5, name: "Dr. Sofia Nikolova",      specialty: "Dermatology",      location: "Sofia",   phone: "+359 (2) 567-8901",   email: "sofia.nikolova@inreach.bg",     bio: "Skin health specialist providing diagnostic and therapeutic dermatological services.",                  availability: "Tue-Sat, 9AM-5PM",       image: "https://ui-avatars.com/api/?name=Sofia+Nikolova&background=4a4699&color=fff&bold=true&size=200",     lat: 42.6977, lng: 23.3219 },
  { id: 6, name: "Dr. Yorgos Papadopoulos", specialty: "Neurology",       location: "Plovdiv", phone: "+359 (32) 678-9012",  email: "yorgos.papadopoulos@inreach.bg",bio: "Neurological disorders specialist with comprehensive diagnostic and treatment expertise.",                availability: "Mon, Wed, Fri, 9AM-3PM", image: "https://ui-avatars.com/api/?name=Yorgos+Papadopoulos&background=4a4699&color=fff&bold=true&size=200",lat: 42.1354, lng: 24.7453 },
];

const pendingRequests: any[] = [];

export default function Home() {
  const { isEasyMode } = useEasyMode();
  const { user, registrationLocation } = useAuth();

  // Patient-only guard — redirects doctors to /doctor-home, guests to /login
  const { isLoading: authLoading } = useRoleGuard("PATIENT");

  // ── Doctor proximity ───────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "default">("loading");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestSentIds, setRequestSentIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [maxDistance] = useState(200);

  const specialties = Array.from(new Set(ALL_DOCTORS.map((d) => d.specialty))).sort();

  useEffect(() => {
    // Seed with registration location first
    if (registrationLocation) {
      setUserLocation({ lat: registrationLocation.lat, lng: registrationLocation.lng });
      setLocationStatus("granted");
    }

    if (!("geolocation" in navigator)) {
      if (!registrationLocation) {
        setUserLocation({ lat: 42.6977, lng: 23.3219 });
        setLocationStatus("default");
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus("granted"); },
      () => {
        if (!registrationLocation) {
          setUserLocation({ lat: 42.6977, lng: 23.3219 });
          setLocationStatus("default");
        }
      }
    );
  }, [registrationLocation]);

  const doctorsWithDistance = useMemo(() => {
    if (!userLocation) return ALL_DOCTORS;
    return ALL_DOCTORS.map((d) => ({ ...d, distance: calculateDistance(userLocation.lat, userLocation.lng, d.lat, d.lng) }));
  }, [userLocation]);

  const filteredDoctors = useMemo(() => {
    return doctorsWithDistance
      .filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialty = !selectedSpecialty || d.specialty === selectedSpecialty;
        return matchesSearch && matchesSpecialty && (d.distance === undefined || d.distance <= maxDistance);
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [doctorsWithDistance, searchQuery, selectedSpecialty, maxDistance]);

  // ── Normal mode request form state ────────────────────────────────────────
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [requestForm, setRequestForm] = useState({ doctorType: "", address: "", situation: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [locating, setLocating] = useState(false);

  const doctorTypes = ["General Practitioner", "Pediatrician", "Cardiologist", "Dermatologist", "Orthopedic Surgeon", "Neurologist", "Psychiatrist", "Dentist", "Eye Specialist", "ENT Specialist"];

  // Pre-fill address from registration location
  useEffect(() => {
    if (registrationLocation && !requestForm.address) {
      setSelectedLocation(registrationLocation);
      setRequestForm((prev) => ({ ...prev, address: registrationLocation.address }));
    }
  }, [registrationLocation]);

  const handleRequestChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedLocation({ lat, lng, address });
    setRequestForm((prev) => ({ ...prev, address }));
  };

  const handleAutoLocate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          .then((r) => r.json())
          .then((data) => {
            const addr = data.display_name || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            setSelectedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: addr });
            setRequestForm((prev) => ({ ...prev, address: addr }));
          })
          .finally(() => setLocating(false));
      },
      () => setLocating(false)
    );
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.doctorType || !requestForm.address.trim() || !requestForm.situation.trim()) {
      alert("Please fill in all required fields.");
      return;
    }
    console.log("Request:", requestForm, selectedLocation);
    setRequestForm({ doctorType: "", address: registrationLocation?.address ?? "", situation: "", notes: "" });
    setSelectedLocation(registrationLocation ?? null);
    setShowMap(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  if (authLoading) return null;

  // ── EASY MODE — doctors list with search + specialty filter ────────────────
  if (isEasyMode) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="em-page">
          <div>
            <h1 className="em-heading">Nearby Specialists</h1>
            <p className="em-body">
              {locationStatus !== "loading"
                ? locationStatus === "granted"
                  ? `Showing doctors within ${maxDistance} km of your location.`
                  : `Showing doctors within ${maxDistance} km of Sofia (location access denied).`
                : "Detecting your location…"}
            </p>
          </div>

          {/* Search bar */}
          <div className="em-card flex items-center gap-3" style={{ padding: "12px 20px" }}>
            <svg className="w-6 h-6 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or specialty…"
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

          {/* Specialty filter — always visible */}
          <div className="em-card" style={{ padding: "16px 20px" }}>
            <label className="em-label" style={{ fontSize: "16px", marginBottom: "8px" }}>Filter by Specialty</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSpecialty("")}
                className={`px-4 py-2 rounded-full text-base font-semibold border-2 transition-colors ${!selectedSpecialty ? "bg-(--clr-primary) text-white border-(--clr-primary)" : "border-(--clr-accent) text-(--clr-nav) hover:border-(--clr-primary)"}`}
              >
                All
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

          {/* Doctor list */}
          <div className="flex flex-col gap-4">
            {filteredDoctors.length === 0 ? (
              <div className="em-card text-center">
                <p className="em-body text-gray-500">No doctors found. Try a different search or specialty.</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedSpecialty(""); }}
                  className="em-btn-primary mt-4" style={{ padding: "12px 24px", fontSize: "16px" }}
                >
                  Clear Filters
                </button>
              </div>
            ) : filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="em-card flex flex-row overflow-hidden cursor-pointer"
                style={{ padding: 0 }}
                onClick={() => { setSelectedDoctor(doctor); setIsModalOpen(true); }}
              >
                <div className="w-40 shrink-0 bg-linear-to-b from-(--clr-primary) to-(--clr-primary-hover) overflow-hidden">
                  <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 flex flex-col justify-center grow">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="em-subheading" style={{ marginBottom: 0 }}>{doctor.name}</h2>
                    {doctor.distance !== undefined && (
                      <span className="em-body font-bold text-(--clr-primary-hover) shrink-0 ml-4" style={{ marginBottom: 0 }}>{doctor.distance.toFixed(1)} km</span>
                    )}
                  </div>
                  <p className="inline-flex self-start px-3 py-1 rounded-full text-sm font-semibold bg-(--clr-accent-light) text-(--clr-primary-hover) mb-2 mt-1">{doctor.specialty}</p>
                  <p className="em-body text-gray-600 line-clamp-2" style={{ marginBottom: 0 }}>{doctor.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DoctorDetailModal
          doctor={selectedDoctor}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSendRequest={(id) => setRequestSentIds((p) => [...p, id])}
          requestSent={selectedDoctor ? requestSentIds.includes(selectedDoctor.id) : false}
        />
      </div>
    );
  }

  // ── NORMAL MODE ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Profile header */}
        <div className="mb-10 pl-1">
          <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-1">
            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Patient Dashboard"}
          </h1>
          <p className="text-xs text-gray-400 font-medium tracking-widest opacity-60">
            EGN: {user?.egn || "0000000000"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Last Checkup */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col min-h-[160px]">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Health History</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Last Checkup</h2>
            <div className="mt-auto">
              <p className="text-xs text-gray-400 italic leading-relaxed">
                * This feature requires an established connection with the official Bulgarian healthcare system (HNIS).
              </p>
            </div>
          </div>

          {/* Condition Overview */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col min-h-[160px]">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Health Summary</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Condition Overview</h2>
            <div className="mt-auto">
              <p className="text-xs text-gray-400 italic leading-relaxed">
                * Health status tracking requires integration with national healthcare databases.
              </p>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Status Monitor</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{pendingRequests.length} Request{pendingRequests.length !== 1 ? "s" : ""}</h2>
            <p className="text-sm text-gray-600 mb-6 flex-grow">View the status of your submitted requests and track their progress.</p>
            <Link to="/pending-requests" className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200 text-center">
              View Requests
            </Link>
          </div>

          {/* Browse Doctors */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Healthcare</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Find a Specialist</h2>
            <p className="text-sm text-gray-600 mb-6 flex-grow">Browse doctors near you and send a visit request directly from their profile.</p>
            <Link to="/doctors" className="block w-full bg-[var(--clr-primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--clr-primary-hover)] transition-colors duration-200 text-center">
              Browse Doctors
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 uppercase tracking-wide mb-4">InReach Information</h2>
          <div className="space-y-3 text-gray-600 text-sm">
            <p>All consultations are conducted by registered medical professionals with appropriate credentials and licensing.</p>
            <p>Patient records are encrypted and stored securely in compliance with health data protection standards.</p>
            <p>Medical consultations available across multiple specialties including general medicine, pediatrics, cardiology, dermatology, and more.</p>
            <p>Response times vary based on specialist availability and case complexity. Standard assessment period: 24-48 hours.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

