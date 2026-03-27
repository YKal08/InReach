import { useState, lazy, Suspense } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { useEasyMode } from "../components/EasyModeContext";
import RequestDoctorModal from "../components/RequestDoctorModal";
import { useAuth } from "../components/AuthContext";

const MapComponent = lazy(() => import("../components/MapPicker"));

// Pending requests mock data (shared between both views)
const pendingRequests: any[] = [];

export default function Home() {
  const { isEasyMode } = useEasyMode();
  const { user } = useAuth();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Easy Mode inline form state
  const [formData, setFormData] = useState({ doctorType: "", address: "", situation: "" });
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const doctorTypes = [
    "General Practitioner", "Pediatrician", "Cardiologist", "Dermatologist",
    "Orthopedic Surgeon", "Neurologist", "Psychiatrist", "Dentist",
    "Eye Specialist", "ENT Specialist",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedLocation({ lat, lng, address });
    setFormData((prev) => ({ ...prev, address }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorType || !formData.address.trim() || !formData.situation.trim()) {
      alert("Please fill in all fields");
      return;
    }
    console.log("Doctor Request:", formData, selectedLocation);
    setFormData({ doctorType: "", address: "", situation: "" });
    setSelectedLocation(null);
    setShowMap(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  // ── Easy Mode ────────────────────────────────────────────────────────────────
  if (isEasyMode) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />

        <div className="em-page">
          {/* Request form */}
          <section className="em-card">
            <h1 className="em-heading">Request a Practitioner</h1>
            <p className="em-body">Fill in the form below to request a visit from a medical professional.</p>

            {submitted && (
              <div className="em-success">Your request has been submitted successfully.</div>
            )}

            <form onSubmit={handleSubmit} className="em-form-grid">
              {/* Doctor Type */}
              <div>
                <label htmlFor="em-doctorType" className="em-label">
                  Type of Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  id="em-doctorType"
                  name="doctorType"
                  value={formData.doctorType}
                  onChange={handleChange}
                  className="em-input"
                >
                  <option value="">Select a doctor type</option>
                  {doctorTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="em-label">
                  Location <span className="text-red-500">*</span>
                </label>
                {!showMap ? (
                  <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your address or use the map pin"
                      rows={1}
                      className="flex-1 px-4 py-3 border-0 focus:outline-none resize-none text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="p-3 text-gray-500 hover:text-[var(--clr-accent)] hover:bg-gray-50 border-l border-gray-300"
                      title="Pick on map"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">Loading map...</div>}>
                      <MapComponent selectedLocation={selectedLocation} onLocationSelect={handleLocationSelect} />
                    </Suspense>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setShowMap(false); setSelectedLocation(null); setFormData((p) => ({ ...p, address: "" })); }} className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium">Cancel</button>
                      <button type="button" onClick={() => setShowMap(false)} className="flex-1 bg-(--clr-primary) text-white px-4 py-2.5 rounded-lg font-medium hover:bg-(--clr-primary-hover) transition-colors duration-200">Done</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Situation — full width */}
              <div className="em-full-width">
                <label htmlFor="em-situation" className="em-label">
                  Describe Your Situation <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="em-situation"
                  name="situation"
                  value={formData.situation}
                  onChange={handleChange}
                  placeholder="Explain your medical situation, symptoms, or concerns..."
                  rows={5}
                  className="em-input resize-none"
                />
              </div>

              {/* Submit — full width */}
              <div className="em-full-width">
                <button type="submit" className="em-btn-primary w-full">
                  Submit Request
                </button>
              </div>
            </form>
          </section>

          {/* Pending Requests */}
          <section className="em-card">
            <h2 className="em-subheading">Your Pending Requests</h2>

            {pendingRequests.length === 0 ? (
              <p className="em-body text-gray-500">You have no pending requests at this time.</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req: any) => (
                  <div key={req.id} className="border-2 border-gray-200 rounded-lg p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="em-body font-semibold">{req.doctorType}</h3>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">{req.status}</span>
                    </div>
                    <p className="em-body text-gray-600 mb-1"><span className="font-semibold">Location:</span> {req.address}</p>
                    <p className="em-body text-gray-600"><span className="font-semibold">Situation:</span> {req.situation}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // ── Normal Mode ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Profile Identity */}
        <div className="mb-10 pl-1">
          <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-1">
            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Patient Dashboard"}
          </h1>
          <p className="text-xs text-gray-400 font-medium tracking-widest opacity-60">
            EGN: {user?.egn || "0000000000"}
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Last Checkup Box (Simplified) */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col min-h-[160px]">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Health History</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Last Checkup</h2>
            <div className="mt-auto">
              <p className="text-xs text-gray-400 italic leading-relaxed">
                * This feature requires an established connection with the official Bulgarian healthcare system (HNIS).
              </p>
            </div>
          </div>

          {/* Condition Overview (Simplified) */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col min-h-[160px]">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Health Summary</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Condition Overview</h2>
            <div className="mt-auto">
              <p className="text-xs text-gray-400 italic leading-relaxed">
                * Health status tracking requires integration with national healthcare databases.
              </p>
            </div>
          </div>

          {/* Request Practitioner (Existing) */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Healthcare</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Request a Practitioner</h2>
            <p className="text-sm text-gray-600 mb-6 flex-grow">
              Submit a request to connect with a qualified medical professional in your area.
            </p>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="block w-full bg-[var(--clr-primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--clr-primary-hover)] active:bg-[var(--clr-primary)] transition-colors duration-200 text-center"
            >
              Make a Request
            </button>
          </div>

          {/* Pending Requests (Existing) */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Status Monitor</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{pendingRequests.length} Request{pendingRequests.length !== 1 ? "s" : ""}</h2>
            <p className="text-sm text-gray-600 mb-6 flex-grow">
              View the status of your submitted requests and track their progress.
            </p>
            <Link
              to="/pending-requests"
              className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 active:bg-gray-400 transition-colors duration-200 text-center"
            >
              View Requests
            </Link>
          </div>
        </div>

        {/* Information Section */}
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

      <RequestDoctorModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}
