import type { Route } from "./+types/register";
import { Link, useNavigate } from "react-router";
import { useState, lazy, Suspense } from "react";
import Navbar from "../components/Navbar";
import TermsModal from "../components/TermsModal";
import { useEasyMode } from "../components/EasyModeContext";
import { useAuth } from "../components/AuthContext";
import { isValidEGN } from "../utils/egn";
import { useRoleGuard } from "../utils/useRoleGuard";

const MapComponent = lazy(() => import("../components/MapPicker"));

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Sign Up - InReach" },
    { name: "description", content: "Create your InReach account" },
  ];
}

// ── Icons (defined outside to avoid re-creation) ──────────────────────────────
const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const PinIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ── LocationField moved OUTSIDE Register so it never remounts on each render ──
interface LocationFieldProps {
  inputCls: string;
  mapHeight: string;
  showMap: boolean;
  locating: boolean;
  addressLocation: string;
  selectedLocation: { lat: number; lng: number; address: string } | null;
  onAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutoLocate: () => void;
  onOpenMap: () => void;
  onClearMap: () => void;
  onConfirmMap: () => void;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

function LocationField({
  inputCls,
  mapHeight,
  showMap,
  locating,
  addressLocation,
  selectedLocation,
  onAddressChange,
  onAutoLocate,
  onOpenMap,
  onClearMap,
  onConfirmMap,
  onLocationSelect,
}: LocationFieldProps) {
  return (
    <>
      {!showMap ? (
        <div className="flex items-center border-2 border-[var(--clr-accent)] rounded-lg overflow-hidden focus-within:border-[var(--clr-accent-muted)]">
          <input
            type="text"
            name="addressLocation"
            id="reg-address"
            value={addressLocation}
            onChange={onAddressChange}
            placeholder="City, District or use buttons →"
            className={`${inputCls} border-0 focus:outline-none focus:ring-0 bg-white`}
            required
          />
          <button
            type="button"
            onClick={onAutoLocate}
            disabled={locating}
            title="Use my current location"
            className="shrink-0 px-3 py-2 text-gray-500 hover:text-[var(--clr-primary)] border-l border-[var(--clr-accent)] transition-colors disabled:opacity-50"
          >
            {locating ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : <PinIcon />}
          </button>
          <button
            type="button"
            onClick={onOpenMap}
            title="Pick on map"
            className="shrink-0 px-3 py-2 text-gray-500 hover:text-[var(--clr-primary)] border-l border-[var(--clr-accent)] transition-colors"
          >
            <GlobeIcon />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Suspense fallback={
            <div className={`${mapHeight} bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-300`}>
              Loading map...
            </div>
          }>
            <MapComponent selectedLocation={selectedLocation} onLocationSelect={onLocationSelect} />
          </Suspense>
          {selectedLocation && (
            <p className="text-xs text-green-700 font-medium bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              ✓ {selectedLocation.address}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClearMap}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onConfirmMap}
              className="flex-1 bg-[var(--clr-primary)] text-white py-2 rounded-lg text-xs font-bold hover:bg-[var(--clr-primary-hover)] transition-colors"
            >
              Confirm Location
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Register() {
  const { isEasyMode } = useEasyMode();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    countryCode: "+359",
    phone: "",
    egn: "",
    addressLocation: "",
    acceptTerms: false,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [egnError, setEgnError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const { isLoading: authLoading } = useRoleGuard("unauthenticated");

  const countries = [
    { code: "+1", iso: "US" }, { code: "+44", iso: "GB" }, { code: "+359", iso: "BG" },
    { code: "+33", iso: "FR" }, { code: "+49", iso: "DE" }, { code: "+39", iso: "IT" },
    { code: "+34", iso: "ES" }, { code: "+31", iso: "NL" }, { code: "+43", iso: "AT" },
    { code: "+41", iso: "CH" }, { code: "+46", iso: "SE" }, { code: "+47", iso: "NO" },
    { code: "+45", iso: "DK" }, { code: "+358", iso: "FI" }, { code: "+30", iso: "GR" },
    { code: "+48", iso: "PL" }, { code: "+420", iso: "CZ" }, { code: "+36", iso: "HU" },
    { code: "+40", iso: "RO" }, { code: "+90", iso: "TR" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (name === "egn") {
      setEgnError(value && !isValidEGN(value) ? "Invalid EGN format. Please check the 10 digits." : "");
    }
  };

  // Dedicated handler for the address input to keep it stable
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, addressLocation: value }));
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedLocation({ lat, lng, address });
    setFormData((prev) => ({ ...prev, addressLocation: address }));
  };

  const handleAutoLocate = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          .then((r) => r.json())
          .then((data) => {
            const addr = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setSelectedLocation({ lat: latitude, lng: longitude, address: addr });
            setFormData((prev) => ({ ...prev, addressLocation: addr }));
          })
          .catch(() => {
            const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setFormData((prev) => ({ ...prev, addressLocation: fallback }));
          })
          .finally(() => setLocating(false));
      },
      () => {
        alert("Could not get your location. Please allow location access or type it manually.");
        setLocating(false);
      }
    );
  };

  const handleClearMap = () => {
    setShowMap(false);
    setSelectedLocation(null);
    setFormData((p) => ({ ...p, addressLocation: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return; }
    if (!isValidEGN(formData.egn)) { setError("Please enter a valid Bulgarian EGN."); return; }
    if (!formData.acceptTerms) { setError("Please accept the terms and conditions."); return; }
    setIsLoading(true);
    try {
      const backendData = {
        egn: formData.egn,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.addressLocation,
        telephone: `${formData.countryCode}${formData.phone}`,
        email: formData.email,
        password: formData.password,
      };
      await register(backendData, selectedLocation ?? undefined);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  // Shared props for LocationField
  const locationFieldProps = {
    showMap,
    locating,
    addressLocation: formData.addressLocation,
    selectedLocation,
    onAddressChange: handleAddressChange,
    onAutoLocate: handleAutoLocate,
    onOpenMap: () => setShowMap(true),
    onClearMap: handleClearMap,
    onConfirmMap: () => setShowMap(false),
    onLocationSelect: handleLocationSelect,
  };

  if (authLoading) return null;

  // ── Easy Mode ─────────────────────────────────────────────────────────────────
  if (isEasyMode) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="em-page">
          <section className="em-card">
            {isSubmitted ? (
              <div className="text-center py-10 animate-fade-in">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="em-heading text-green-700">Registration Success!</h1>
                <p className="em-body mb-8">
                  Your registration has been submitted successfully.<br /><br />
                  <strong>Important:</strong> An administrator needs to approve your account before you can sign in. This usually takes 24 hours.
                </p>
                <Link to="/login" className="em-btn-primary block w-full text-center">Back to Sign In</Link>
              </div>
            ) : (
              <>
                <h1 className="em-heading">Create Account</h1>
                <p className="em-body">Fill in the form below to create your InReach account.</p>
                {error && <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-xl mb-6 text-xl font-bold">{error}</div>}
                <form onSubmit={handleSubmit} className="em-form-grid">
                  <div>
                    <label htmlFor="em-firstName" className="em-label">First Name</label>
                    <input id="em-firstName" type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="em-input" required />
                  </div>
                  <div>
                    <label htmlFor="em-lastName" className="em-label">Last Name</label>
                    <input id="em-lastName" type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="em-input" required />
                  </div>
                  <div>
                    <label htmlFor="em-email" className="em-label">Email Address</label>
                    <input id="em-email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="em-input" required />
                  </div>
                  <div>
                    <label htmlFor="em-egn" className="em-label">EGN (Bulgarian ID Number)</label>
                    <input
                      id="em-egn"
                      type="text"
                      name="egn"
                      value={formData.egn}
                      onChange={handleChange}
                      placeholder="1234567890"
                      maxLength={10}
                      className={`em-input ${egnError ? "border-red-500 bg-red-50" : ""}`}
                      required
                    />
                    {egnError
                      ? <p className="text-red-600 font-bold mt-1" style={{ fontSize: "18px" }}>{egnError}</p>
                      : <p className="em-body text-gray-500 mt-1" style={{ fontSize: "16px" }}>10-digit Bulgarian national ID number</p>
                    }
                  </div>
                  <div>
                    <label className="em-label">Phone Number</label>
                    <div className="flex gap-2">
                      <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="em-input" style={{ width: "auto", flexShrink: 0 }} required>
                        {countries.map((c) => <option key={c.code} value={c.code}>{c.iso} {c.code}</option>)}
                      </select>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 000-0000" className="em-input flex-1" required />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-address" className="em-label">Address / Location</label>
                    <LocationField {...locationFieldProps} inputCls="em-input flex-1" mapHeight="h-64" />
                  </div>
                  <div>
                    <label htmlFor="em-password" className="em-label">Password</label>
                    <input id="em-password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="em-input" required />
                  </div>
                  <div>
                    <label htmlFor="em-confirmPassword" className="em-label">Confirm Password</label>
                    <input id="em-confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="em-input" required />
                  </div>
                  <div className="em-full-width">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="w-5 h-5 rounded border-gray-300" required />
                      <span className="em-body">I agree to the{" "}
                        <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-(--clr-primary) hover:text-(--clr-primary-hover) font-bold underline">
                          terms and conditions
                        </button>
                      </span>
                    </label>
                  </div>
                  <div className="em-full-width">
                    <button type="submit" className="em-btn-primary w-full disabled:opacity-50" disabled={isLoading}>
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </button>
                  </div>
                </form>
                <p className="em-body mt-6">
                  Already have an account?{" "}
                  <Link to="/login" className="text-(--clr-primary) hover:text-(--clr-primary-hover) font-bold underline">Sign in here</Link>
                </p>
              </>
            )}
          </section>
        </div>
        <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
        <footer className="bg-gray-100 border-t border-gray-200 mt-20 animate-fade-in">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center text-black">
            <p>&copy; 2025 InReach. Bringing healthcare to remote areas.</p>
          </div>
        </footer>
      </div>
    );
  }

  // ── Normal Mode ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg p-8 border border-gray-200 animate-scale-in shadow-md">
            {isSubmitted ? (
              <div className="text-center py-6 animate-fade-in">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Registration Submitted!</h1>
                <p className="text-gray-600 mb-6">Your account is pending administrator approval.</p>
                <Link to="/login" className="text-(--clr-primary) font-bold hover:underline transition-all">Sign in here</Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6 animate-fade-in">
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h1>
                  <p className="text-gray-600">Create your account</p>
                </div>
                {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium text-center">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 animate-slide-in-up [animation-delay:100ms]">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--clr-accent)" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--clr-accent)" required />
                    </div>
                  </div>
                  <div className="animate-slide-in-up [animation-delay:200ms]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--clr-accent)" required />
                  </div>
                  <div className="animate-slide-in-up [animation-delay:300ms]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="flex gap-2">
                      <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--clr-accent) bg-white text-sm" required>
                        {countries.map((c) => <option key={c.code} value={c.code}>{c.iso} {c.code}</option>)}
                      </select>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 000-0000" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--clr-accent)" required />
                    </div>
                  </div>
                  <div className="animate-slide-in-up [animation-delay:400ms]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">EGN (Bulgarian ID Number)</label>
                    <input
                      type="text"
                      name="egn"
                      value={formData.egn}
                      onChange={handleChange}
                      placeholder="1234567890"
                      maxLength={10}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-(--clr-accent) ${egnError ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                      required
                    />
                    {egnError
                      ? <p className="text-xs text-red-600 mt-1 font-medium">{egnError}</p>
                      : <p className="text-xs text-gray-500 mt-1">10-digit Bulgarian national ID number</p>
                    }
                  </div>
                  <div className="animate-slide-in-up [animation-delay:500ms]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address / Location</label>
                    <LocationField {...locationFieldProps} inputCls="flex-1 px-4 py-2 text-sm" mapHeight="h-48" />
                  </div>
                  <div className="animate-slide-in-up [animation-delay:600ms]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--clr-accent)" required />
                  </div>
                  <div className="animate-slide-in-up [animation-delay:700ms]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--clr-accent)" required />
                  </div>
                  <label className="flex items-start animate-slide-in-up [animation-delay:800ms]">
                    <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 mt-0.5" required />
                    <span className="ml-2 text-sm text-gray-700">
                      I agree to the{" "}
                      <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-(--clr-primary) hover:text-(--clr-primary-hover) font-semibold underline transition-all duration-200">
                        terms and conditions
                      </button>
                    </span>
                  </label>
                  <button
                    type="submit"
                    className="w-full bg-(--clr-primary) text-white py-2 rounded-lg font-bold hover:bg-(--clr-primary-hover) hover:scale-105 active:scale-95 transition-all duration-200 mt-2 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>
                <p className="text-center text-gray-600 mt-6">
                  Already have an account?{" "}
                  <Link to="/login" className="text-(--clr-primary) hover:text-(--clr-primary-hover) font-bold hover:underline transition-all duration-200">Sign in here</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <footer className="bg-gray-100 border-t border-gray-200 mt-20 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-black">
          <p>&copy; 2025 InReach. Bringing healthcare to remote areas.</p>
        </div>
      </footer>
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
    </div>
  );
}