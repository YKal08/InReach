import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useEasyMode } from "./EasyModeContext";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { isEasyMode, toggleEasyMode } = useEasyMode();
  const { isAuthenticated, isDoctor, logout, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email?.split("@")[0] ?? "Account";

  // Where "InReach" / "Home" links point
  const homeHref = !isAuthenticated ? "/" : isDoctor ? "/doctor-home" : "/home";
  const isAdmin = user?.roles?.includes("ADMIN");

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
          {!isEasyMode && isAuthenticated && (!isDoctor || isAdmin) && (
            <Link
              to="/doctors"
              className="text-white hover:text-gray-200 font-medium transition py-1 hidden sm:inline text-sm"
            >
              Doctors
            </Link>
          )}
          {isAdmin && !isEasyMode && (
            <>
              <div className="h-5 w-px bg-white opacity-30" />
              <span className="text-yellow-300 text-xs font-bold px-2 py-1 bg-yellow-600 bg-opacity-30 rounded">ADMIN</span>
            </>
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
                <div className="flex items-center gap-3">
                  {/* Profile button */}
                  <button
                    onClick={() => navigate("/profile")}
                    className="flex items-center gap-1.5 text-white hover:text-gray-200 font-medium transition py-1 whitespace-nowrap text-sm"
                  >
                    {/* Avatar initials bubble */}
                    <span className="w-6 h-6 rounded-full bg-[var(--clr-primary)] flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                      {displayName.charAt(0)}
                    </span>
                    <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
                  </button>


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
                    className="px-4 py-1.5 bg-[var(--clr-primary)] text-white rounded-lg font-medium hover:bg-[var(--clr-primary-hover)] transition whitespace-nowrap text-sm"
                  >
                    Sign Up
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

