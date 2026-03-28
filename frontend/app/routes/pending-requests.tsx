import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { useRoleGuard } from "../utils/useRoleGuard";
import { api } from "../utils/api";

interface PendingRequest {
  id: string;
  doctorType: string;
  address: string;
  status: string;
  notes?: string;
  doctorEgn: string;
}

interface DoctorApiResponse {
  egn: string;
  firstName: string;
  lastName: string;
}

function statusClass(status: string): string {
  const normalized = status?.toUpperCase();
  if (normalized === "PENDING") return "bg-yellow-100 text-yellow-800";
  if (normalized === "ACCEPTED") return "bg-blue-100 text-blue-800";
  if (normalized === "IN_PROGRESS") return "bg-indigo-100 text-indigo-800";
  if (normalized === "COMPLETED") return "bg-emerald-100 text-emerald-800";
  if (normalized === "CANCELLED") return "bg-gray-200 text-gray-700";
  return "bg-gray-100 text-gray-700";
}

export default function PendingRequests() {
  const { isLoading } = useRoleGuard("PATIENT");
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [doctorNamesByEgn, setDoctorNamesByEgn] = useState<Record<string, string>>({});
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoadingRequests(true);
    setError(null);
    try {
      const response = await api.get<PendingRequest[]>("/visit_request/get");
      setRequests(response);
    } catch (e: any) {
      setError(e?.message ?? "Неуспешно зареждане на заявките.");
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();

    const loadDoctorNames = async () => {
      try {
        const doctors = await api.get<DoctorApiResponse[]>("/users/doctors/nearby");
        const next: Record<string, string> = {};
        for (const doctor of doctors) {
          const fullName = `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim();
          if (doctor.egn && fullName) {
            next[doctor.egn] = `Д-р ${fullName}`;
          }
        }
        setDoctorNamesByEgn(next);
      } catch {
        setDoctorNamesByEgn({});
      }
    };

    loadDoctorNames();
  }, []);

  const sortedRequests = useMemo(() => {
    const priority: Record<string, number> = {
      PENDING: 1,
      ACCEPTED: 2,
      IN_PROGRESS: 3,
      COMPLETED: 4,
      CANCELLED: 5,
    };

    return [...requests].sort((a, b) => {
      const aRank = priority[a.status?.toUpperCase()] ?? 99;
      const bRank = priority[b.status?.toUpperCase()] ?? 99;
      return aRank - bRank;
    });
  }, [requests]);

  const handleCancel = async (requestId: string) => {
    setCancellingId(requestId);
    setError(null);
    try {
      await api.post("/visit_request/cancel", { requestId });
      await loadRequests();
    } catch (e: any) {
      setError(e?.message ?? "Неуспешно отказване на заявката.");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Пациентски портал</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Моите заявки</h1>
          <p className="text-gray-600">
            {sortedRequests.length} общо заявк{sortedRequests.length !== 1 ? "и" : "а"}
          </p>
        </div>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {/* Back Button */}
        <Link
          to="/home"
          className="inline-block mb-8 text-(--clr-accent) hover:text-(--clr-accent-muted) font-medium transition-colors"
        >
          ← Обратно към началото
        </Link>

        {/* Requests List */}
        {loadingRequests ? (
          <div className="bg-white border border-gray-200 p-12 rounded-lg shadow-sm text-center">
            <p className="text-gray-600">Зареждане на заявки...</p>
          </div>
        ) : sortedRequests.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 rounded-lg shadow-sm text-center">
            <p className="text-gray-600 mb-6">Нямате подадени заявки в момента.</p>
            <Link
              to="/doctors"
              className="inline-block bg-(--clr-primary) text-white px-6 py-3 rounded-lg font-medium hover:bg-(--clr-primary-hover) transition-colors"
            >
              Направи нова заявка
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {doctorNamesByEgn[request.doctorEgn] || `Д-р (${request.doctorEgn})`}
                    </h3>
                    <p className="text-sm text-gray-500">Лекар EGN: {request.doctorEgn}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass(request.status)}`}>
                    {request.status}
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      Локация
                    </p>
                    <p className="text-gray-700">{request.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      Бележки
                    </p>
                    <p className="text-gray-600">{request.notes || "Няма"}</p>
                  </div>
                </div>

                {request.status?.toUpperCase() === "PENDING" && (
                  <button
                    onClick={() => handleCancel(request.id)}
                    disabled={cancellingId === request.id}
                    className="text-(--clr-accent) hover:text-(--clr-accent-muted) font-medium transition-colors disabled:opacity-60"
                  >
                    {cancellingId === request.id ? "Отказване..." : "Откажи заявката"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Information Section */}
        <div className="mt-12 bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Информация за статусите на заявка
          </h2>
          <div className="space-y-3 text-gray-600 text-sm">
            <p>
              • <strong>Чакаща:</strong> Заявката е подадена и очаква лекар да я прегледа и приеме.
            </p>
            <p>
              • <strong>Приета:</strong> Лекар е прегледал и приел заявката ви. Скоро ще се свърже с вас за насрочване на консултация.
            </p>
            <p>
              • <strong>В процес:</strong> Консултацията ви е насрочена или се изпълнява в момента.
            </p>
            <p>
              • <strong>Завършена:</strong> Консултацията е приключила. При нужда можете да подадете нова заявка.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
