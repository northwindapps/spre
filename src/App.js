import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from "react";
import SpreadsheetGrid from "./SpreadsheetGrid";
import HandDetector from "./HandDetector";
function App() {
    // Use a ref instead of state
    const fingerPosRef = useRef(null);
    return (_jsxs("div", { style: { padding: 5, position: "relative" }, children: [_jsx("h5", { children: "My Spreadsheet" }), _jsx(SpreadsheetGrid, { fingerPosRef: fingerPosRef }), _jsx("div", { style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none", // so it doesn’t block mouse
                    zIndex: 9999,
                }, children: _jsx(HandDetector, { onFingerMove: ({ x, y, label }) => {
                        // Update ref directly, no re-render
                        fingerPosRef.current = { x, y, label };
                    } }) })] }));
}
export default App;
