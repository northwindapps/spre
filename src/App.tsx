import React from "react";
import SpreadsheetGrid from "./SpreadsheetGrid";
import HandDetector from "./HandDetector";

function App() {
  return (
    <div style={{ padding: 5, position: "relative" }}>
      <h5>My Spreadsheet</h5>

      {/* Spreadsheet */}
      <SpreadsheetGrid />

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
        <HandDetector />
      </div>
    </div>
  );
}


export default App;


// function App() {
//   return (
//     <div>
//       <HandDetector />
//     </div>
//   );
// }

// export default App;
