import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../components/AuthContext";

export default function Landing() {
  const { isAuthenticated, isDoctor, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users away from the landing page immediately
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(isDoctor ? "/doctor-home" : "/home", { replace: true });
    }
  }, [isAuthenticated, isDoctor, isLoading, navigate]);

  // Show nothing while resolving auth (avoids flash)
  if (isLoading) return null;

  // Also show nothing if about to redirect
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="mb-16 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 animate-slide-in-down">
            Медицинска помощ до вашата врата
          </h1>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed animate-slide-in-up [animation-delay:100ms]">
            Свържете се с квалифицирани лекари в отдалечени райони. Получете медицинска помощ когато и където ви е нужна, без излишно пътуване.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-up [animation-delay:200ms]">
            <Link
              to="/register"
              className="bg-(--clr-primary) text-white px-8 py-3 rounded-lg font-semibold hover:bg-(--clr-primary-hover) active:bg-(--clr-primary) transition-all duration-200 text-center"
            >
              Започнете
            </Link>
            <Link
              to="/login"
              className="border-2 border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all duration-200 text-center"
            >
              Вход
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 animate-fade-in">Защо да изберете InReach</h2>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 animate-slide-in-up [animation-delay:100ms]">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Квалифицирани медицински специалисти</h3>
            <p className="text-gray-600">Достъп до проверени и лицензирани лекари, посветени на качествена медицинска грижа в отдалечени общности.</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 animate-slide-in-up [animation-delay:200ms]">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Бързо и лесно начало</h3>
            <p className="text-gray-600">Лесна регистрация, която отнема само няколко минути. Започнете да заявявате прегледи веднага след регистрация.</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 animate-slide-in-up [animation-delay:300ms]">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Сигурност и поверителност</h3>
            <p className="text-gray-600">Вашата здравна информация е криптирана и защитена. Спазваме строги правила за поверителност, за да останат данните ви конфиденциални.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-20 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-black">
          <p>&copy; 2025 InReach. Доставяме здравна грижа в отдалечени райони.</p>
        </div>
      </footer>
    </div>
  );
}
