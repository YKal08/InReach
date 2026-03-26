import { Link } from "react-router";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p>home</p>
    </div>
  );
}
