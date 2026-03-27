import { useState, lazy, Suspense } from "react";

interface RequestDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Lazy load the map component to avoid SSR issues with Leaflet
const MapComponent = lazy(() => import("./MapPicker"));

export default function RequestDoctorModal({
  isOpen,
  onClose,
}: RequestDoctorModalProps) {
  const [formData, setFormData] = useState({
    doctorType: "",
    address: "",
    situation: "",
  });
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedLocation({ lat, lng, address });
    setFormData((prev) => ({
      ...prev,
      address: address,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorType || !formData.address.trim() || !formData.situation.trim()) {
      alert("Please fill in all fields");
      return;
    }
    // TODO: Send request to backend
    console.log("Doctor Request:", formData, selectedLocation);
    setFormData({ doctorType: "", address: "", situation: "" });
    setSelectedLocation(null);
    setShowMap(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 border-b border-gray-200 p-6 flex justify-between items-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-900">Request Practitioner</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Doctor Type Selection */}
          <div>
            <label
              htmlFor="doctorType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Type of Doctor <span className="text-red-500">*</span>
            </label>
            <select
              id="doctorType"
              name="doctorType"
              value={formData.doctorType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--clr-accent)] focus:border-transparent"
            >
              <option value="">Select a doctor type</option>
              {doctorTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Location Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            
            {!showMap ? (
              <div className="space-y-3">
                <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[var(--clr-accent)] focus-within:border-transparent focus-within:border-transparent transition-all">
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address or click the map icon to pinpoint your location"
                    rows={1}
                    className="flex-1 px-4 py-2 border-0 focus:outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="p-2 text-(--clr-primary) hover:text-(--clr-primary-hover) hover:bg-(--clr-accent-light) rounded transition-colors duration-200 shrink-0 m-1"
                    title="Pinpoint location on map"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>}>
                  <MapComponent
                    selectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect}
                  />
                </Suspense>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMap(false);
                      setSelectedLocation(null);
                      setFormData((prev) => ({
                        ...prev,
                        address: "",
                      }));
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMap(false)}
                    className="flex-1 bg-(--clr-primary) text-white px-4 py-2 rounded-lg font-medium hover:bg-(--clr-primary-hover) transition-colors duration-200"
                  >
                    Done
                  </button>
                  {selectedLocation && (
                    <div className="flex-1 bg-[var(--clr-success-bg)] border border-[#d0e8e4] px-4 py-2 rounded-lg text-sm text-[var(--clr-accent-muted)] flex items-center">
                      ✓ {selectedLocation.address}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Situation Description */}
          <div>
            <label
              htmlFor="situation"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Describe Your Situation <span className="text-red-500">*</span>
            </label>
            <textarea
              id="situation"
              name="situation"
              value={formData.situation}
              onChange={handleChange}
              placeholder="Explain your medical situation, symptoms, or concerns. This helps the doctor understand your needs before accepting your request."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--clr-accent)] focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-(--clr-primary) text-white px-6 py-3 rounded-lg font-semibold hover:bg-(--clr-primary-hover) active:bg-(--clr-primary) transition-colors duration-200"
            >
              Submit Request
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
