import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import SpreadsheetGrid from "./SpreadsheetGrid";
import HandDetector from "./HandDetector";
function App() {
    return (_jsxs("div", { style: { padding: 5, position: "relative" }, children: [_jsx("h5", { children: "My Spreadsheet" }), _jsx(SpreadsheetGrid, {}), _jsx("div", { style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none", // 🔥 so it doesn’t block mouse
                    zIndex: 9999,
                }, children: _jsx(HandDetector, {}) })] }));
}
export default App;
