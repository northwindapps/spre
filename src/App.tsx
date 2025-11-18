import React, { useState } from "react";
import SpreadsheetGrid from "./SpreadsheetGrid";
import HandDetector from "./HandDetector";

function App() {
  const [fingerPos, setFingerPos] = useState<{ x: number; y: number } | null>(null);
  return (
    <div style={{ padding: 5, position: "relative" }}>
      <h5>My Spreadsheet</h5>

      {/* Spreadsheet */}
      <SpreadsheetGrid fingerPos={fingerPos} />


      {/* Hand overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",      // 🔥 so it doesn’t block mouse
        zIndex: 9999,
      }}>
      <HandDetector onFingerMove={({ x, y }) => setFingerPos({ x, y })} />
      </div>
    </div>
  );
}


export default App;