import type { Route } from "./+types/login";
import { Link } from "react-router";
import { useState } from "react";
import Navbar from "../components/Navbar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - InReach" },
    { name: "description", content: "Sign in to your InReach account" },
  ];
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 text-white py-2 rounded-lg font-bold hover:bg-teal-700 transition mt-6"
              >
                Sign In
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-teal-600 hover:text-teal-700 font-bold">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-slate-800 border-t border-slate-900 mt-20">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-300">
          <p className="mb-4">&copy; 2025 InReach. Bringing healthcare to remote areas.</p>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 hover:text-teal-300 underline transition text-sm"
          >
            Terms and Conditions
          </a>
        </div>
      </footer>
    </div>
  );
}
