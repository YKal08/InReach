import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { useRoleGuard } from "../utils/useRoleGuard";
import { api } from "../utils/api";
import { useAuth } from "../components/AuthContext";

interface DoctorApiResponse {
  egn: string;
  firstName: string;
  lastName: string;
  address: string;
  description: string;
}

export default function RequestDoctor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading } = useRoleGuard("PATIENT");
  const [formData, setFormData] = useState({
    doctorType: "",
    address: "",
    notes: "",
    doctorEgn: "",
  });
  const [doctors, setDoctors] = useState<DoctorApiResponse[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doctorTypes = [
    "Общопрактикуващ лекар",
    "Педиатър",
    "Кардиолог",
    "Дерматолог",
    "Ортопед",
    "Невролог",
    "Психиатър",
    "Зъболекар",
    "Очен специалист",
    "УНГ специалист",
  ];

  useEffect(() => {
    const loadDoctors = async () => {
      setLoadingDoctors(true);
      setError(null);
      try {
        const response = await api.get<DoctorApiResponse[]>("/users/doctors/nearby");
        setDoctors(response);
      } catch (e: any) {
        setError(e?.message ?? "Неуспешно зареждане на наличните лекари.");
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    if (user?.address && !formData.address) {
      setFormData((prev) => ({ ...prev, address: user.address }));
    }
  }, [user?.address, formData.address]);

  const availableDoctorTypes = useMemo(() => {
    return Array.from(
      new Set([
        ...doctorTypes,
        ...doctors
          .map((d) => d.description?.trim())
          .filter((d): d is string => !!d),
      ])
    );
  }, [doctors]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorType || !formData.address.trim() || !formData.doctorEgn) {
      alert("Моля, попълнете всички полета");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/visit_request/create/${formData.doctorEgn}`, {
        address: formData.address.trim(),
        doctorType: formData.doctorType,
        notes: formData.notes.trim() || undefined,
      });
      navigate("/home");
    } catch (e: any) {
      setError(e?.message ?? "Неуспешно изпращане на заявката.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Заяви лекар</h1>
          <p className="text-gray-600 mb-8">Кажете ни какъв тип лекар ви е нужен и къде се намирате</p>
          {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="doctorEgn" className="block text-sm font-medium text-gray-700 mb-2">
                Изберете лекар <span className="text-red-500">*</span>
              </label>
              <select
                id="doctorEgn"
                name="doctorEgn"
                value={formData.doctorEgn}
                onChange={handleChange}
                disabled={loadingDoctors}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">{loadingDoctors ? "Зареждане на лекари..." : "Изберете лекар"}</option>
                {doctors.map((doctor) => (
                  <option key={doctor.egn} value={doctor.egn}>
                    {`${doctor.firstName} ${doctor.lastName}`.trim()} - {doctor.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Type Selection */}
            <div>
              <label htmlFor="doctorType" className="block text-sm font-medium text-gray-700 mb-2">
                Тип лекар <span className="text-red-500">*</span>
              </label>
              <select
                id="doctorType"
                name="doctorType"
                value={formData.doctorType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Изберете тип лекар</option>
                {availableDoctorTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Address Input */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Вашият адрес <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Въведете пълния си адрес"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Бележки
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Допълнителна информация (по избор)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-(--clr-primary) text-white px-6 py-3 rounded-lg font-semibold hover:bg-(--clr-primary-hover) hover:scale-105 active:scale-95 transition-all duration-200"
              >
                {isSubmitting ? "Изпращане..." : "Заяви лекар"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-all duration-200"
              >
                Отказ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
