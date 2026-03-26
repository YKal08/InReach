import type { Route } from "./+types/doctors";
import Navbar from "../components/Navbar";
import { useEasyMode } from "../components/EasyModeContext";
import { useState, useMemo } from "react";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  experience: number;
  location: string;
  phone: string;
  email: string;
  bio: string;
  availability: string;
  image: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Meet Our Specialists - InReach" },
    { name: "description", content: "Browse our network of healthcare professionals" },
  ];
}

export default function Doctors() {
  const { isEasyMode } = useEasyMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const doctors: Doctor[] = [
    {
      id: 1,
      name: "Dr. Maria Ivanova",
      specialty: "General Medicine",
      experience: 12,
      location: "Sofia",
      phone: "+359 (2) 123-4567",
      email: "maria.ivanova@inreach.bg",
      bio: "Experienced general practitioner with a passion for preventive care and patient education.",
      availability: "Mon-Fri, 9AM-5PM",
      image: "https://ui-avatars.com/api/?name=Maria+Ivanova&background=4a4699&color=fff&bold=true&size=200",
    },
    {
      id: 2,
      name: "Dr. Alexander Petrov",
      specialty: "Cardiology",
      experience: 18,
      location: "Plovdiv",
      phone: "+359 (32) 234-5678",
      email: "alex.petrov@inreach.bg",
      bio: "Specializing in cardiovascular diseases with advanced diagnostic expertise.",
      availability: "Tue-Sat, 10AM-6PM",
      image: "https://ui-avatars.com/api/?name=Alexander+Petrov&background=4a4699&color=fff&bold=true&size=200",
    },
    {
      id: 3,
      name: "Dr. Elena Georgieva",
      specialty: "Pediatrics",
      experience: 15,
      location: "Varna",
      phone: "+359 (52) 345-6789",
      email: "elena.georgieva@inreach.bg",
      bio: "Child health specialist dedicated to providing compassionate pediatric care.",
      availability: "Mon-Thu, 8AM-4PM",
      image: "https://ui-avatars.com/api/?name=Elena+Georgieva&background=4a4699&color=fff&bold=true&size=200",
    },
    {
      id: 4,
      name: "Dr. Ivan Dimitrov",
      specialty: "Orthopedics",
      experience: 20,
      location: "Burgas",
      phone: "+359 (56) 456-7890",
      email: "ivan.dimitrov@inreach.bg",
      bio: "Expert in bone and joint conditions with surgical and non-surgical treatment options.",
      availability: "Wed-Sun, 11AM-7PM",
      image: "https://ui-avatars.com/api/?name=Ivan+Dimitrov&background=4a4699&color=fff&bold=true&size=200",
    },
    {
      id: 5,
      name: "Dr. Sofia Nikolova",
      specialty: "Dermatology",
      experience: 10,
      location: "Sofia",
      phone: "+359 (2) 567-8901",
      email: "sofia.nikolova@inreach.bg",
      bio: "Skin health specialist providing diagnostic and therapeutic dermatological services.",
      availability: "Tue-Sat, 9AM-5PM",
      image: "https://ui-avatars.com/api/?name=Sofia+Nikolova&background=4a4699&color=fff&bold=true&size=200",
    },
    {
      id: 6,
      name: "Dr. Yorgos Papadopoulos",
      specialty: "Neurology",
      experience: 16,
      location: "Plovdiv",
      phone: "+359 (32) 678-9012",
      email: "yorgos.papadopoulos@inreach.bg",
      bio: "Neurological disorders specialist with comprehensive diagnostic and treatment expertise.",
      availability: "Mon, Wed, Fri, 9AM-3PM",
      image: "https://ui-avatars.com/api/?name=Yorgos+Papadopoulos&background=4a4699&color=fff&bold=true&size=200",
    },
  ];

  const specialties = Array.from(new Set(doctors.map((doc) => doc.specialty))).sort();
  const locations = Array.from(new Set(doctors.map((doc) => doc.location))).sort();

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
      const matchesLocation = !selectedLocation || doctor.location === selectedLocation;
      return matchesSearch && matchesSpecialty && matchesLocation;
    });
  }, [searchQuery, selectedSpecialty, selectedLocation]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className={isEasyMode ? "em-page" : "max-w-7xl mx-auto px-4 py-4"}>
        <div className="mb-6 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-4 animate-slide-in-down">Meet Our Specialists</h1>
          <p className="text-lg text-gray-600 animate-slide-in-up [animation-delay:100ms]">
            Browse our network of dedicated healthcare professionals serving remote and underserved areas.
          </p>
        </div>

        {/* Search and Filters Section */}
        <div className="mb-4 relative animate-slide-in-up [animation-delay:200ms]">
          <div className="bg-white rounded border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 px-3 py-2">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-2 py-2 focus:outline-none text-sm text-gray-900 placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-gray-400 hover:text-gray-600 transition"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition flex items-center gap-1 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
            </div>

            {/* Filter Dropdown */}
            {showFilters && (
              <div className={`absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 p-5 animate-scale-in ${isEasyMode ? "w-full grid grid-cols-2 gap-5" : "w-80 grid grid-cols-1 gap-5"}`}>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Specialty</label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-(--clr-accent) bg-white text-xs"
                  >
                    <option value="">All Specialties</option>
                    {specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-(--clr-accent) bg-white text-xs"
                  >
                    <option value="">All Locations</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div className={`text-center pt-2 border-t border-gray-200 ${isEasyMode ? "col-span-2" : ""}`}>
                  <button
                    onClick={() => { setSelectedSpecialty(""); setSelectedLocation(""); }}
                    className="text-xs text-(--clr-accent) hover:text-(--clr-accent-muted) font-semibold hover:scale-105 transition-all duration-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {filteredDoctors.length > 0 ? (
          <>
            <p className="text-xs text-gray-400 opacity-60 mb-6 animate-fade-in">
              Found {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""}
            </p>

            {/* EASY MODE: Landscape list */}
            {isEasyMode ? (
              <div className="flex flex-col gap-4">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-xl border-2 border-(--clr-accent-light) overflow-hidden flex flex-row"
                  >
                    <div className="w-44 shrink-0 bg-linear-to-b from-(--clr-primary) to-(--clr-primary-hover) overflow-hidden">
                      <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 flex flex-col grow justify-center">
                      <h2 className="em-subheading" style={{marginBottom: "4px"}}>{doctor.name}</h2>
                      <p className="inline-flex self-start px-3 py-1 rounded-full text-sm font-semibold bg-(--clr-accent-light) text-(--clr-primary-hover) mb-2">{doctor.specialty}</p>
                      <p className="em-body text-gray-600">{doctor.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* NORMAL MODE: Portrait grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                {filteredDoctors.map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-(--clr-accent-light) overflow-hidden flex flex-col animate-slide-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Doctor Photo — portrait top */}
                    <div className="w-full aspect-square bg-linear-to-b from-(--clr-primary) to-(--clr-primary-hover) overflow-hidden shrink-0">
                      <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                    </div>
                    {/* Info — bottom */}
                    <div className="p-4 flex flex-col grow">
                      <h2 className="text-base font-bold text-gray-900 mb-0.5">{doctor.name}</h2>
                      <p className="inline-flex self-start px-2.5 py-1 rounded-full text-xs font-semibold bg-(--clr-accent-light) text-(--clr-primary-hover) mb-2">{doctor.specialty}</p>
                      <p className="text-xs text-gray-600 grow leading-relaxed">{doctor.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md p-12 border border-gray-200 animate-scale-in">
            <p className="text-lg text-gray-600 mb-4">No doctors found matching your search criteria.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedSpecialty(""); setSelectedLocation(""); }}
              className="px-6 py-2 bg-(--clr-accent-dark) text-white rounded-lg font-semibold hover:bg-(--clr-accent-dark) hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <footer className="bg-gray-100 border-t border-gray-200 mt-20 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-black">
          <p>&copy; 2025 InReach. Bringing healthcare to remote areas.</p>
        </div>
      </footer>
    </div>
  );
}
