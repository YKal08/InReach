import { Link } from "react-router";
import Navbar from "../components/Navbar";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="mb-16 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 animate-slide-in-down">
            Healthcare at Your Doorstep
          </h1>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed animate-slide-in-up [animation-delay:100ms]">
            Connect with qualified doctors in remote areas. Get medical care when and where you need it, without the hassle of traveling.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-up [animation-delay:200ms]">
            <Link
              to="/register"
              className="bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 hover:scale-105 active:scale-95 transition-all duration-200 text-center"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border-2 border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all duration-200 text-center"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section - Vertical Layout */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 animate-fade-in">Why Choose InReach</h2>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 animate-slide-in-up [animation-delay:100ms]">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Qualified Medical Professionals</h3>
            <p className="text-gray-600">Access to verified and credentialed doctors who are committed to providing quality healthcare services to remote communities.</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 animate-slide-in-up [animation-delay:200ms]">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick and Easy Setup</h3>
            <p className="text-gray-600">Simple registration process that takes just a few minutes. Start booking appointments and receiving care immediately after signing up.</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 animate-slide-in-up [animation-delay:300ms]">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Secure and Private</h3>
            <p className="text-gray-600">Your health information is encrypted and protected. We follow strict privacy guidelines to ensure your data remains confidential.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-20 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-black">
          <p>&copy; 2025 InReach. Bringing healthcare to remote areas.</p>
        </div>
      </footer>
    </div>
  );
}
