import { useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";

export default function RequestDoctor() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    doctorType: "",
    address: "",
  });

  const doctorTypes = [
    "General Practitioner",
    "Pediatrician",
    "Cardiologist",
    "Dermatologist",
    "Orthopedic Surgeon",
    "Neurologist",
    "Psychiatrist",
    "Dentist",
    "Eye Specialist",
    "ENT Specialist",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorType || !formData.address.trim()) {
      alert("Please fill in all fields");
      return;
    }
    // TODO: Send request to backend
    console.log("Doctor Request:", formData);
    // Redirect back to home after successful submission
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Doctor</h1>
          <p className="text-gray-600 mb-8">Tell us what type of doctor you need and where you're located</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor Type Selection */}
            <div>
              <label htmlFor="doctorType" className="block text-sm font-medium text-gray-700 mb-2">
                Type of Doctor <span className="text-red-500">*</span>
              </label>
              <select
                id="doctorType"
                name="doctorType"
                value={formData.doctorType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select a doctor type</option>
                {doctorTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Address Input */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Your Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your full address"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Request Doctor
              </button>
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
