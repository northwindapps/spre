import React, { useRef } from "react";
import SpreadsheetGrid from "./SpreadsheetGrid";
import HandDetector from "./HandDetector";

function App() {
  // Use a ref instead of state
  const fingerPosRef = useRef<{ x: number; y: number; label: string; ts: number } | null>(null);

  return (
    <div style={{ padding: 5, position: "relative" }}>
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
          pointerEvents: "none", // so it doesn’t block mouse
          zIndex: 9999,
        }}
      >
        <HandDetector
          onFingerMove={({ x, y, label,ts }) => {
            // Update ref directly, no re-render
            fingerPosRef.current = { x, y, label,ts };
          }}
        />
      </div>
    </div>
  );
}

export default App;
