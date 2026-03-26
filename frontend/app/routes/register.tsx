import type { Route } from "./+types/register";
import { Link } from "react-router";
import { useState } from "react";
import Navbar from "../components/Navbar";
import TermsModal from "../components/TermsModal";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - InReach" },
    { name: "description", content: "Create your InReach account" },
  ];
}

export default function Register() {
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
    { code: "+1", iso: "US", flag: "🇺🇸" },
    { code: "+44", iso: "GB", flag: "🇬🇧" },
    { code: "+359", iso: "BG", flag: "🇧🇬" },
    { code: "+33", iso: "FR", flag: "🇫🇷" },
    { code: "+49", iso: "DE", flag: "🇩🇪" },
    { code: "+39", iso: "IT", flag: "🇮🇹" },
    { code: "+34", iso: "ES", flag: "🇪🇸" },
    { code: "+31", iso: "NL", flag: "🇳🇱" },
    { code: "+43", iso: "AT", flag: "🇦🇹" },
    { code: "+41", iso: "CH", flag: "🇨🇭" },
    { code: "+46", iso: "SE", flag: "🇸🇪" },
    { code: "+47", iso: "NO", flag: "🇳🇴" },
    { code: "+45", iso: "DK", flag: "🇩🇰" },
    { code: "+358", iso: "FI", flag: "🇫🇮" },
    { code: "+30", iso: "GR", flag: "🇬🇷" },
    { code: "+48", iso: "PL", flag: "🇵🇱" },
    { code: "+420", iso: "CZ", flag: "🇨🇿" },
    { code: "+36", iso: "HU", flag: "🇭🇺" },
    { code: "+40", iso: "RO", flag: "🇷🇴" },
    { code: "+90", iso: "TR", flag: "🇹🇷" },
  ];

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    console.log(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg p-8 border border-gray-200 animate-scale-in shadow-md hover:shadow-lg transition-all duration-200">
            <div className="text-center mb-6 animate-fade-in">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h1>
              <p className="text-gray-600">Create your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 animate-slide-in-up [animation-delay:100ms]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div className="animate-slide-in-up [animation-delay:200ms]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="animate-slide-in-up [animation-delay:300ms]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                  required
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.iso} {country.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 000-0000"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div className="animate-slide-in-up [animation-delay:400ms]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EGN (Bulgarian ID Number)
              </label>
              <input
                type="text"
                name="egn"
                value={formData.egn}
                onChange={handleChange}
                placeholder="1234567890"
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">10-digit Bulgarian national ID number</p>
            </div>

            <div className="animate-slide-in-up [animation-delay:500ms]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address / Location
              </label>
              <input
                type="text"
                name="addressLocation"
                value={formData.addressLocation}
                onChange={handleChange}
                placeholder="City, District"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="animate-slide-in-up [animation-delay:600ms]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="animate-slide-in-up [animation-delay:700ms]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <label className="flex items-start animate-slide-in-up [animation-delay:800ms]">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 mt-0.5"
                required
              />
              <span className="ml-2 text-sm text-gray-700">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  className="text-teal-600 hover:text-teal-700 font-semibold cursor-pointer underline hover:scale-105 transition-all duration-200"
                >
                  terms and conditions
                </button>
              </span>
            </label>

            <TermsModal 
              isOpen={isTermsModalOpen}
              onClose={() => setIsTermsModalOpen(false)}
            />

            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-2 rounded-lg font-bold hover:bg-teal-700 hover:scale-105 active:scale-95 transition-all duration-200 mt-6 animate-slide-in-up [animation-delay:900ms]"
            >
              Create Account
            </button>
            </form>

            <p className="text-center text-gray-600 mt-6 animate-fade-in [animation-delay:1000ms]">
              Already have an account?{" "}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-bold hover:underline hover:scale-105 transition-all duration-200">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-gray-100 border-t border-gray-200 mt-20 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-black">
          <p>&copy; 2025 InReach. Bringing healthcare to remote areas.</p>
        </div>
      </footer>
    </div>
  );
}
