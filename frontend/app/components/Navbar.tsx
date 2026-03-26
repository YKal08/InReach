import { Link } from "react-router";
import { useEasyMode } from "./EasyModeContext";

export default function Navbar() {
  const { isEasyMode, toggleEasyMode } = useEasyMode();

  return (
    <nav className="w-full bg-teal-800 border-b border-teal-900 shadow-md">
      <div
        className={`${
          isEasyMode
            ? "w-full px-6 py-3"
            : "max-w-7xl mx-auto px-4 py-2.5"
        } flex justify-between items-center`}
      >
        {/* Left: Brand + nav links */}
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            className="font-bold text-white hover:text-gray-200 transition whitespace-nowrap leading-none text-xl"
          >
            {isEasyMode ? "Home" : "InReach"}
          </Link>
          <div className="h-5 w-px bg-teal-600" />
          <Link
            to="/doctors"
            className="text-gray-300 hover:text-white font-medium transition py-1 hidden sm:inline text-sm"
          >
            Doctors
          </Link>
        </div>

        {/* Right: Easy Mode toggle + auth links */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm font-medium hidden sm:inline">Easy Mode</span>
            {/* Toggle switch — identical shape in both modes */}
            <button
              onClick={toggleEasyMode}
              className={`relative inline-flex h-6 w-10 items-center rounded-full ${
                isEasyMode ? "bg-teal-500" : "bg-gray-500"
              }`}
              title={isEasyMode ? "Switch to normal mode" : "Switch to easy mode"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white ${
                  isEasyMode ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <Link
            to="/login"
            className="text-gray-300 hover:text-white font-medium transition py-1 whitespace-nowrap text-sm"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700 font-medium transition whitespace-nowrap text-sm"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
