import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import SpreadsheetGrid from "./SpreadsheetGrid";
import HandDetector from "./HandDetector";
function App() {
    const [fingerPos, setFingerPos] = useState(null);
    return (_jsxs("div", { style: { padding: 5, position: "relative" }, children: [_jsx("h5", { children: "My Spreadsheet" }), _jsx(SpreadsheetGrid, { fingerPos: fingerPos }), _jsx("div", { style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none", // 🔥 so it doesn’t block mouse
                    zIndex: 9999,
                }, children: _jsx(HandDetector, { onFingerMove: ({ x, y }) => setFingerPos({ x, y }) }) })] }));
}
export default App;
