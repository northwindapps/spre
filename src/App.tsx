import React, { useRef } from "react";
import SpreadsheetGrid from "./SpreadsheetGrid";
import HandDetector from "./HandDetector";

function App() {
  const fingerPosRef = useRef<{ x: number; y: number; label: string; ts: number } | null>(null);

  const socialLinks = [
    { name: "See developer's LinkedIn profile", url: "https://www.linkedin.com/in/yujin-yano-aa507a391/", emoji: "💼" }
  ];

  return (
    <div style={{ padding: 5, position: "relative", fontFamily: "sans-serif" }}>
      <h5>My Spreadsheet</h5>

      {/* Spreadsheet */}
      <SpreadsheetGrid fingerPosRef={fingerPosRef} />

      {/* Hand overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      >
        <HandDetector
          onFingerMove={({ x, y, label, ts }) => {
            fingerPosRef.current = { x, y, label, ts };
          }}
        />
      </div>

      {/* Social links footer */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: "12px",
          fontSize: "1rem",
          position: "fixed"
        }}
      >
        {socialLinks.map(link => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            {link.emoji} {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}

export default App;
