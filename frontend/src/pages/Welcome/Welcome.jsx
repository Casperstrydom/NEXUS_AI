import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Monitor, Smartphone, X } from "lucide-react";

function Welcome() {
  const navigate = useNavigate();

  const [showDownloadPopup, setShowDownloadPopup] = useState(true);

  function handleGetStarted() {
    navigate("/signup");
  }

  function handleLogin() {
    navigate("/login");
  }

  return (
    <main className="welcome-page">
      <section className="welcome-content">
        <div className="brand">
          <div className="brand-symbol">✦</div>
          <h1>NexusAI</h1>
        </div>

        <h2>
          Your AI.
          <br />
          Your imagination.
        </h2>

        <p>
          Talk, create, learn, explore and bring your ideas to life with
          NexusAI.
        </p>

        <div className="welcome-actions">
          <button className="primary-button" onClick={handleGetStarted}>
            Get Started
          </button>

          <button className="secondary-button" onClick={handleLogin}>
            I already have an account
          </button>
        </div>
      </section>

      {showDownloadPopup && (
        <div className="modal-overlay">
          <div className="download-modal">
            <button
              className="modal-close"
              onClick={() => setShowDownloadPopup(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="download-icon">
              <Download size={28} />
            </div>

            <h3>Get NexusAI</h3>

            <p>
              Download NexusAI for your device, or continue using the web
              version.
            </p>

            <div className="download-options">
              <button className="download-option">
                <Monitor size={25} />

                <div>
                  <strong>Windows</strong>
                  <span>Download for Windows</span>
                </div>
              </button>

              <button className="download-option">
                <Smartphone size={25} />

                <div>
                  <strong>Android</strong>
                  <span>Download for Android</span>
                </div>
              </button>
            </div>

            <button
              className="skip-button"
              onClick={() => setShowDownloadPopup(false)}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Welcome;
