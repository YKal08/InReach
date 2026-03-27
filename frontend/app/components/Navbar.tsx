import { Link } from "react-router";
import { useEasyMode } from "./EasyModeContext";

export default function Navbar() {
  const { isEasyMode, toggleEasyMode } = useEasyMode();

  return (
    <nav className="w-full bg-[var(--clr-nav)] border-b border-[var(--clr-nav-dark)] shadow-md">
      <div
        className={`${
          isEasyMode
            ? "w-full px-6 py-3"
            : "max-w-7xl mx-auto px-4 py-2.5"
        } flex justify-between items-center`}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            className="font-bold text-white hover:text-gray-200 transition whitespace-nowrap leading-none text-xl"
          >
            {isEasyMode ? "Home" : "InReach"}
          </Link>
          <div className="h-5 w-px bg-white opacity-30" />
          <Link
            to="/doctors"
            className="text-white hover:text-gray-200 font-medium transition py-1 hidden sm:inline text-sm"
          >
            Doctors
          </Link>
        </div>

        {/* Right */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium hidden sm:inline">Easy Mode</span>
            <button
              onClick={toggleEasyMode}
              className={`relative inline-flex h-6 w-10 items-center rounded-full ${
                isEasyMode ? "bg-[var(--clr-primary)]" : "bg-white/30"
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
            className="text-white hover:text-gray-200 font-medium transition py-1 whitespace-nowrap text-sm"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-[var(--clr-primary)] text-white px-3 py-1.5 rounded-md hover:bg-[var(--clr-nav-light)] font-medium transition whitespace-nowrap text-sm"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
