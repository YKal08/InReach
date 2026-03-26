import { Link } from "react-router";

export default function Navbar() {
  return (
    <nav className="bg-teal-800 border-b border-teal-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white hover:text-gray-200 transition">
          InReach
        </Link>
        <div className="flex gap-6 items-center">
          <Link to="/login" className="text-gray-300 hover:text-white font-medium transition py-2">
            Login
          </Link>
          <Link to="/register" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium transition">
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}

