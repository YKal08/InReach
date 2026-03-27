import { useEffect } from "react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 border-b border-gray-200 p-6 flex justify-between items-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-900">Terms and Conditions</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h3>
            <p className="text-gray-700">
              By accessing and using the InReach platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Use License</h3>
            <p className="text-gray-700 mb-3">
              Permission is granted to temporarily download one copy of the materials (information or software) on InReach for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on InReach</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Disclaimer</h3>
            <p className="text-gray-700">
              The materials on InReach are provided on an "as is" basis. InReach makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Limitations</h3>
            <p className="text-gray-700">
              In no event shall InReach or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on InReach, even if InReach or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Accuracy of Materials</h3>
            <p className="text-gray-700">
              The materials appearing on InReach could include technical, typographical, or photographic errors. InReach does not warrant that any of the materials on its website are accurate, complete, or current. InReach may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Links</h3>
            <p className="text-gray-700">
              InReach has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by InReach of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Modifications</h3>
            <p className="text-gray-700">
              InReach may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Governing Law</h3>
            <p className="text-gray-700">
              These terms and conditions of use are governed by and construed in accordance with the laws of the jurisdiction in which InReach operates and you irrevocably submit to the exclusive jurisdiction of the courts located in that location.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">9. User Conduct</h3>
            <p className="text-gray-700 mb-3">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Transmit any harmful or malicious code</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Misrepresent your identity or affiliation</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Contact Information</h3>
            <p className="text-gray-700">
              If you have any questions about these Terms and Conditions, please contact us through the contact information available on our website.
            </p>
          </section>

        </div>

        <div className="sticky bottom-0 bg-white/95 border-t border-gray-200 px-6 py-4 backdrop-blur-sm">
          <p className="text-sm text-gray-600">Last updated: March 26, 2026</p>
        </div>

      </div>
    </div>
  );
}
