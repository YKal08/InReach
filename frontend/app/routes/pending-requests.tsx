import { Link } from "react-router";
import Navbar from "../components/Navbar";

export default function PendingRequests() {
  // TODO: Fetch pending requests from backend
  const pendingRequests = [
    // Example data structure:
    // {
    //   id: "1",
    //   doctorType: "General Practitioner",
    //   situation: "Persistent headaches and fever for 3 days",
    //   address: "123 Main Street, Downtown, Springfield",
    //   submittedDate: "2025-03-26",
    //   status: "pending"
    // }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Patient Portal</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Pending Requests</h1>
          <p className="text-gray-600">
            {pendingRequests.length} pending request{pendingRequests.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Back Button */}
        <Link
          to="/home"
          className="inline-block mb-8 text-[var(--clr-accent)] hover:text-[var(--clr-accent-muted)] font-medium transition-colors"
        >
          ← Back to Home
        </Link>

        {/* Requests List */}
        {pendingRequests.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 rounded-lg shadow-sm text-center">
            <p className="text-gray-600 mb-6">You have no pending requests at this time.</p>
            <Link
              to="/home"
              className="inline-block bg-[var(--clr-accent-dark)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--clr-accent-dark)] transition-colors"
            >
              Make a New Request
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div
                key={request.id}
                className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {request.doctorType}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(request.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    {request.status}
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      Location
                    </p>
                    <p className="text-gray-700">{request.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      Situation
                    </p>
                    <p className="text-gray-600">{request.situation}</p>
                  </div>
                </div>

                <button className="text-[var(--clr-accent)] hover:text-[var(--clr-accent-muted)] font-medium transition-colors">
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Information Section */}
        <div className="mt-12 bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Request Status Information
          </h2>
          <div className="space-y-3 text-gray-600 text-sm">
            <p>
              • <strong>Pending:</strong> Your request has been submitted and is waiting for a
              doctor to review and accept it.
            </p>
            <p>
              • <strong>Accepted:</strong> A doctor has reviewed and accepted your request. They
              will contact you shortly to schedule a consultation.
            </p>
            <p>
              • <strong>In Progress:</strong> Your consultation is currently scheduled or in
              progress.
            </p>
            <p>
              • <strong>Completed:</strong> Your consultation has been completed. You may request
              a new consultation if needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
