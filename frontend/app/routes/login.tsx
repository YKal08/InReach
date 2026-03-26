import type { Route } from "./+types/login";
import { Link } from "react-router";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { useEasyMode } from "../components/EasyModeContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - InReach" },
    { name: "description", content: "Sign in to your InReach account" },
  ];
}

export default function Login() {
  const { isEasyMode } = useEasyMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password });
  };

  if (isEasyMode) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="em-page">
          <section className="em-card">
            <h1 className="em-heading">Welcome Back</h1>
            <p className="em-body">Sign in to your account.</p>
            <form onSubmit={handleSubmit} className="em-form-grid">
              <div>
                <label htmlFor="em-email" className="em-label">Email Address</label>
                <input
                  id="em-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="em-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="em-password" className="em-label">Password</label>
                <input
                  id="em-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="em-input"
                  required
                />
              </div>
              <div className="em-full-width">
                <button type="submit" className="em-btn-primary w-full">Sign In</button>
              </div>
            </form>
            <p className="em-body mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-(--clr-primary) hover:text-(--clr-primary-hover) font-bold underline">Register here</Link>
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg p-8 border border-gray-200 animate-scale-in shadow-md">
            <div className="text-center mb-8 animate-fade-in">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="animate-slide-in-up [animation-delay:100ms]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--clr-accent) transition-all duration-200"
                  required
                />
              </div>

              <div className="animate-slide-in-up [animation-delay:200ms]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--clr-accent) transition-all duration-200"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-(--clr-primary) text-white py-2 rounded-lg font-bold hover:bg-(--clr-primary-hover) hover:scale-105 active:scale-95 transition-all duration-200 mt-6 animate-slide-in-up [animation-delay:300ms]"
              >
                Sign In
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6 animate-fade-in [animation-delay:400ms]">
              Don't have an account?{" "}
              <Link to="/register" className="text-(--clr-primary) hover:text-(--clr-primary-hover) font-bold hover:underline transition-all duration-200">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-gray-100 border-t border-gray-200 mt-20 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-black">
          <p>&copy; 2025 InReach. Bringing healthcare to remote areas.</p>
        </div>
      </footer>
    </div>
  );
}
