export default function AuthBrandPanel() {
  return (
    <div className="login-art">
      <div className="brand">
        <div className="mark">
          <svg viewBox="0 0 48 48">
            <path
              d="M15 12v15a9 9 0 0 0 18 0V12"
              fill="none"
              stroke="#fff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="24" cy="20" r="3.4" fill="#fff" />
          </svg>
        </div>
        <div className="brand-name">USEK PARKING</div>
      </div>

      <div className="lot">
        <div className="lot-watermark">U</div>
        <div className="lot-frame">
          <div className="lot-grid">
            <div className="lot-slot">
              <div
                className="car-shadow"
                style={{ background: "linear-gradient(180deg,#2a3142,#1c2230)" }}
              />
            </div>
            <div className="lot-slot free">
              <div className="pin-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0a0d12" strokeWidth="3" strokeLinecap="round">
                  <path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11z" />
                </svg>
              </div>
            </div>
            <div className="lot-slot">
              <div
                className="car-shadow"
                style={{ background: "linear-gradient(180deg,#6c5ce7,#4a3fb0)" }}
              />
            </div>
            <div className="lot-slot" />
            <div className="lot-slot" />
            <div className="lot-slot" />
            <div className="lot-slot">
              <div
                className="car-shadow"
                style={{ background: "linear-gradient(180deg,#2a3142,#1c2230)" }}
              />
            </div>
            <div className="lot-slot reserved-tone" />
            <div className="lot-slot" />
          </div>
        </div>
      </div>

      <div className="login-pitch">
        <h2>Campus parking,<br />finally without circling around.</h2>
        <p>
          Reserve your spot in real time, scan at the entrance, and track
          your sessions — all from a single space.
        </p>
      </div>
    </div>
  );
}