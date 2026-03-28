import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { useRoleGuard } from "../utils/useRoleGuard";

interface PendingRequest {
  id: string;
  doctorType: string;
  situation: string;
  address: string;
  submittedDate: string;
  status: string;
}

export default function PendingRequests() {
  const { isLoading } = useRoleGuard("PATIENT");

  // TODO: Fetch pending requests from backend
  const pendingRequests: PendingRequest[] = [];

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Пациентски портал</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Чакащи заявки</h1>
          <p className="text-gray-600">
            {pendingRequests.length} чакащ{pendingRequests.length !== 1 ? "и" : "а"} заявк{pendingRequests.length !== 1 ? "и" : "а"}
          </p>
        </div>

        {/* Back Button */}
        <Link
          to="/home"
          className="inline-block mb-8 text-[var(--clr-accent)] hover:text-[var(--clr-accent-muted)] font-medium transition-colors"
        >
          ← Обратно към началото
        </Link>

        {/* Requests List */}
        {pendingRequests.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 rounded-lg shadow-sm text-center">
            <p className="text-gray-600 mb-6">Нямате чакащи заявки в момента.</p>
            <Link
              to="/doctors"
              className="inline-block bg-[var(--clr-primary)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--clr-primary-hover)] transition-colors"
            >
              Направи нова заявка
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div
                key={request.id}
                className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {request.doctorType}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Подадена на: {new Date(request.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
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
                      Ситуация
                    </p>
                    <p className="text-gray-600">{request.situation}</p>
                  </div>
                </div>

                <button className="text-[var(--clr-accent)] hover:text-[var(--clr-accent-muted)] font-medium transition-colors">
                  Виж детайли →
                </button>
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
