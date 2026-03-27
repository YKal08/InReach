import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useEasyMode } from "./EasyModeContext";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { isEasyMode, toggleEasyMode } = useEasyMode();
  const { isAuthenticated, isDoctor, logout, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/");
  };

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email?.split("@")[0] ?? "Account";

  // Where "InReach" / "Home" links point
  const homeHref = !isAuthenticated ? "/" : isDoctor ? "/doctor-home" : "/home";

  return (
    <nav className="w-full bg-[var(--clr-nav)] border-b border-[var(--clr-nav-dark)] shadow-md">
      <div
        className={`${
          isEasyMode ? "w-full px-6 py-3" : "max-w-7xl mx-auto px-4 py-2.5"
        } flex justify-between items-center`}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link
            to={homeHref}
            className="font-bold text-white hover:text-gray-200 transition whitespace-nowrap leading-none text-xl"
          >
            {isEasyMode ? "Home" : "InReach"}
          </Link>
          <div className="h-5 w-px bg-white opacity-30" />
          {!isEasyMode && isAuthenticated && !isDoctor && (
            <Link
              to="/doctors"
              className="text-white hover:text-gray-200 font-medium transition py-1 hidden sm:inline text-sm"
            >
              Doctors
            </Link>
          )}
        </div>

        {/* Right */}
        <div className="flex gap-3 items-center">
          {/* Easy Mode toggle */}
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

          {/* Auth area */}
          {!isLoading && (
            <>
              {isAuthenticated ? (
                /* ── User dropdown ── */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-1.5 text-white hover:text-gray-200 font-medium transition py-1 whitespace-nowrap text-sm"
                  >
                    {/* Avatar initials bubble */}
                    <span className="w-6 h-6 rounded-full bg-[var(--clr-primary)] flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                      {displayName.charAt(0)}
                    </span>
                    <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
                    {/* Chevron */}
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown panel */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-scale-in origin-top-right">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[var(--clr-primary)] transition-colors"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Edit Profile
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
