import type { Route } from "./+types/register";
import { Link } from "react-router";
import { useState } from "react";
import Navbar from "../components/Navbar";
import TermsModal from "../components/TermsModal";
import { useEasyMode } from "../components/EasyModeContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - InReach" },
    { name: "description", content: "Create your InReach account" },
  ];
}

export default function Register() {
  const { isEasyMode } = useEasyMode();
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

  const countries = [
    { code: "+1", iso: "US" }, { code: "+44", iso: "GB" }, { code: "+359", iso: "BG" },
    { code: "+33", iso: "FR" }, { code: "+49", iso: "DE" }, { code: "+39", iso: "IT" },
    { code: "+34", iso: "ES" }, { code: "+31", iso: "NL" }, { code: "+43", iso: "AT" },
    { code: "+41", iso: "CH" }, { code: "+46", iso: "SE" }, { code: "+47", iso: "NO" },
    { code: "+45", iso: "DK" }, { code: "+358", iso: "FI" }, { code: "+30", iso: "GR" },
    { code: "+48", iso: "PL" }, { code: "+420", iso: "CZ" }, { code: "+36", iso: "HU" },
    { code: "+40", iso: "RO" }, { code: "+90", iso: "TR" },
  ];

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    console.log(formData);
  };

  // ── Easy Mode ────────────────────────────────────────────────────────────────
  if (isEasyMode) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="em-page">
          <section className="em-card">
            <h1 className="em-heading">Create Account</h1>
            <p className="em-body">Fill in the form below to create your InReach account.</p>

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
                <input id="em-egn" type="text" name="egn" value={formData.egn} onChange={handleChange} placeholder="1234567890" maxLength={10} className="em-input" required />
                <p className="em-body text-gray-500 mt-1" style={{fontSize: "16px"}}>10-digit Bulgarian national ID number</p>
              </div>
              <div>
                <label className="em-label">Phone Number</label>
                <div className="flex gap-2">
                  <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="em-input" style={{width: "auto", flexShrink: 0}} required>
                    {countries.map((c) => <option key={c.code} value={c.code}>{c.iso} {c.code}</option>)}
                  </select>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 000-0000" className="em-input flex-1" required />
                </div>
              </div>
              <div>
                <label htmlFor="em-address" className="em-label">Address / Location</label>
                <input id="em-address" type="text" name="addressLocation" value={formData.addressLocation} onChange={handleChange} placeholder="City, District" className="em-input" required />
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
                  <span className="em-body">
                    I agree to the{" "}
                    <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-[var(--clr-accent-muted)] font-bold underline">terms and conditions</button>
                  </span>
                </label>
              </div>

              <div className="em-full-width">
                <button type="submit" className="em-btn-primary w-full">Create Account</button>
              </div>
            </form>

            <p className="em-body mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-[var(--clr-accent-muted)] font-bold underline">Sign in here</Link>
            </p>
          </section>
        </div>

        <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      </div>
    );
  }

  // ── Normal Mode ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg p-8 border border-gray-200 animate-scale-in shadow-md">
            <div className="text-center mb-6 animate-fade-in">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h1>
              <p className="text-gray-600">Create your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 animate-slide-in-up [animation-delay:100ms]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)]" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)]" required />
                </div>
              </div>

              <div className="animate-slide-in-up [animation-delay:200ms]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)]" required />
              </div>

              <div className="animate-slide-in-up [animation-delay:300ms]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] bg-white text-sm" required>
                    {countries.map((c) => <option key={c.code} value={c.code}>{c.iso} {c.code}</option>)}
                  </select>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 000-0000" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)]" required />
                </div>
              </div>

              <div className="animate-slide-in-up [animation-delay:400ms]">
                <label className="block text-sm font-medium text-gray-700 mb-1">EGN (Bulgarian ID Number)</label>
                <input type="text" name="egn" value={formData.egn} onChange={handleChange} placeholder="1234567890" maxLength={10} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)]" required />
                <p className="text-xs text-gray-500 mt-1">10-digit Bulgarian national ID number</p>
              </div>

              <div className="animate-slide-in-up [animation-delay:500ms]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address / Location</label>
                <input type="text" name="addressLocation" value={formData.addressLocation} onChange={handleChange} placeholder="City, District" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)]" required />
              </div>

              <div className="animate-slide-in-up [animation-delay:600ms]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)]" required />
              </div>

              <div className="animate-slide-in-up [animation-delay:700ms]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)]" required />
              </div>

              <label className="flex items-start animate-slide-in-up [animation-delay:800ms]">
                <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 mt-0.5" required />
                <span className="ml-2 text-sm text-gray-700">
                  I agree to the{" "}
                  <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-[var(--clr-accent)] hover:text-[var(--clr-accent-muted)] font-semibold cursor-pointer underline transition-all duration-200">
                    terms and conditions
                  </button>
                </span>
              </label>

              <button type="submit" className="w-full bg-[var(--clr-accent-dark)] text-white py-2 rounded-lg font-bold hover:bg-[var(--clr-accent-dark)] hover:scale-105 active:scale-95 transition-all duration-200 mt-2 animate-slide-in-up [animation-delay:900ms]">
                Create Account
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6 animate-fade-in [animation-delay:1000ms]">
              Already have an account?{" "}
              <Link to="/login" className="text-[var(--clr-accent)] hover:text-[var(--clr-accent-muted)] font-bold hover:underline transition-all duration-200">Sign in here</Link>
            </p>
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
