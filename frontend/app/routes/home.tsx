import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { useEasyMode } from "../components/EasyModeContext";
import { useAuth } from "../components/AuthContext";
import DoctorDetailModal from "../components/DoctorDetailModal";
import { useRoleGuard } from "../utils/useRoleGuard";
import { api } from "../utils/api";

const MapComponent = lazy(() => import("../components/MapPicker"));

interface Doctor {
  id: number;
  egn: string;
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

const DEFAULT_SPECIALTY = "Лекар";
const DEFAULT_AVAILABILITY = "Няма наличен график";
const DEFAULT_EMAIL = "Няма публичен имейл";

function toDoctor(apiDoctor: DoctorApiResponse, index: number): Doctor {
  const name = `${apiDoctor.firstName ?? ""} ${apiDoctor.lastName ?? ""}`.trim() || "Неизвестен лекар";
  const avatarName = encodeURIComponent(name);

  return {
    id: index + 1,
    egn: apiDoctor.egn,
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

interface VisitRequestSummary {
  id: string;
  status: string;
}

export default function Home() {
  const { isEasyMode } = useEasyMode();
  const { user, registrationLocation } = useAuth();

  // Patient-only guard — redirects doctors to /doctor-home, guests to /login
  const { isLoading: authLoading } = useRoleGuard("PATIENT");

  // ── Doctor proximity ───────────────────────────────────────────────────────
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isRequestSending, setIsRequestSending] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestSentIds, setRequestSentIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  const specialties = Array.from(new Set(allDoctors.map((d) => d.specialty))).sort();

  useEffect(() => {
    const loadDoctors = async () => {
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
    };

    loadDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    return allDoctors
      .filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialty = !selectedSpecialty || d.specialty === selectedSpecialty;
        return matchesSearch && matchesSpecialty;
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [allDoctors, searchQuery, selectedSpecialty]);

  // ── Normal mode request form state ────────────────────────────────────────
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [requestForm, setRequestForm] = useState({ doctorType: "", address: "", situation: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [myRequests, setMyRequests] = useState<VisitRequestSummary[]>([]);
  const [isMyRequestsLoading, setIsMyRequestsLoading] = useState(true);

  const activeRequestsCount = useMemo(
    () => myRequests.filter((request) => {
      const normalized = request.status?.toUpperCase();
      return normalized !== "CANCELLED" && normalized !== "CANCELED";
    }).length,
    [myRequests]
  );

  const doctorTypes = ["General Practitioner", "Pediatrician", "Cardiologist", "Dermatologist", "Orthopedic Surgeon", "Neurologist", "Psychiatrist", "Dentist", "Eye Specialist", "ENT Specialist"];

  useEffect(() => {
    const loadMyRequests = async () => {
      setIsMyRequestsLoading(true);
      try {
        const response = await api.get<VisitRequestSummary[]>("/visit_request/get");
        setMyRequests(response);
      } catch {
        setMyRequests([]);
      } finally {
        setIsMyRequestsLoading(false);
      }
    };

    loadMyRequests();
  }, []);

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
      alert("Моля, попълнете всички задължителни полета.");
      return;
    }
    console.log("Request:", requestForm, selectedLocation);
    setRequestForm({ doctorType: "", address: registrationLocation?.address ?? "", situation: "", notes: "" });
    setSelectedLocation(registrationLocation ?? null);
    setShowMap(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const handleSendRequest = async (doctorId: number, notes: string) => {
    const doctor = allDoctors.find((d) => d.id === doctorId);
    if (!doctor || isRequestSending) return;

    setRequestError(null);
    setIsRequestSending(true);

    try {
      await api.post(`/visit_request/create/${doctor.egn}`, {
        address: user?.address || doctor.location,
        doctorType: doctor.specialty || DEFAULT_SPECIALTY,
        notes: notes?.trim() || undefined,
      });
      setRequestSentIds((prev) => [...prev, doctorId]);
    } catch (error) {
      console.error("Failed to create visit request:", error);
      setRequestError("Неуспешно изпращане на заявката. Опитайте отново.");
    } finally {
      setIsRequestSending(false);
    }
  };

  if (authLoading) return null;

  // ── EASY MODE — doctors list with search + specialty filter ────────────────
  if (isEasyMode) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="em-page">
          <div>
            <h1 className="em-heading">Специалисти наблизо</h1>
            <p className="em-body">
              Показват се лекари в радиус до 100 км според системата.
            </p>
            {doctorsError && <p className="text-xs text-red-500 mt-1">{doctorsError}</p>}
          </div>

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

          {/* Specialty filter — always visible */}
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

          {/* Doctor list */}
          <div className="flex flex-col gap-4">
            {isDoctorsLoading ? (
              <div className="em-card text-center">
                <p className="em-body text-gray-500">Зареждане на лекарите...</p>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="em-card text-center">
                <p className="em-body text-gray-500">Няма намерени лекари. Опитайте различно търсене или специалност.</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedSpecialty(""); }}
                  className="em-btn-primary mt-4" style={{ padding: "12px 24px", fontSize: "16px" }}
                >
                  Изчисти филтрите
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
                      <span className="em-body font-bold text-(--clr-primary-hover) shrink-0 ml-4" style={{ marginBottom: 0 }}>{doctor.distance.toFixed(1)} км</span>
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
          onSendRequest={handleSendRequest}
          requestSent={selectedDoctor ? requestSentIds.includes(selectedDoctor.id) : false}
          isSending={isRequestSending}
          error={requestError}
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
            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Пациентски профил"}
          </h1>
          <p className="text-xs text-gray-400 font-medium tracking-widest opacity-60">
            EGN: {user?.egn || "0000000000"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Last Checkup */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col min-h-40">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Здравна история</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Последен преглед</h2>
            <div className="mt-auto">
              <p className="text-xs text-gray-400 italic leading-relaxed">
                * Тази функционалност изисква връзка с официалната българска здравна система (НЗИС).
              </p>
            </div>
          </div>

          {/* Condition Overview */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col min-h-40">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Здравен статус</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Общ преглед на състоянието</h2>
            <div className="mt-auto">
              <p className="text-xs text-gray-400 italic leading-relaxed">
                * Проследяването на здравния статус изисква интеграция с национални здравни бази данни.
              </p>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Статус на заявки</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isMyRequestsLoading
                ? "..."
                : `${activeRequestsCount} заявк${activeRequestsCount !== 1 ? "и" : "а"}`}
            </h2>
            <p className="text-sm text-gray-600 mb-6 grow">Проследете статуса на подадените от вас заявки.</p>
            <Link to="/pending-requests" className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200 text-center">
              Виж заявките
            </Link>
          </div>

          {/* Browse Doctors */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Здравни услуги</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Намери специалист</h2>
            <p className="text-sm text-gray-600 mb-6 grow">Разгледайте лекари близо до вас и изпратете заявка директно от профила им.</p>
            <Link to="/doctors" className="block w-full bg-(--clr-primary) text-white px-6 py-3 rounded-lg font-semibold hover:bg-(--clr-primary-hover) transition-colors duration-200 text-center">
              Разгледай лекари
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 uppercase tracking-wide mb-4">Информация за InReach</h2>
          <div className="space-y-3 text-gray-600 text-sm">
            <p>Всички консултации се извършват от регистрирани медицински специалисти с необходимата квалификация и лиценз.</p>
            <p>Пациентските данни са криптирани и съхранявани сигурно съгласно стандартите за защита на здравна информация.</p>
            <p>Предлагат се консултации в множество специалности, включително обща медицина, педиатрия, кардиология, дерматология и други.</p>
            <p>Времето за реакция зависи от наличността на специалистите и сложността на случая. Стандартен срок за оценка: 24-48 часа.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

