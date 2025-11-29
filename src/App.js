import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from "react";
import SpreadsheetGrid from "./SpreadsheetGrid";
import HandDetector from "./HandDetector";
function App() {
    const fingerPosRef = useRef(null);
    const socialLinks = [
        { name: "See developer's LinkedIn profile", url: "https://www.linkedin.com/in/yujin-yano-aa507a391/", emoji: "💼" }
    ];
    return (_jsxs("div", { style: { padding: 5, position: "relative", fontFamily: "sans-serif" }, children: [_jsx("h5", { children: "My Spreadsheet" }), _jsx(SpreadsheetGrid, { fingerPosRef: fingerPosRef }), _jsx("div", { style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 9999,
                }, children: _jsx(HandDetector, { onFingerMove: ({ x, y, label, ts }) => {
                        fingerPosRef.current = { x, y, label, ts };
                    } }) }), _jsx("div", { style: {
                    marginTop: 12,
                    display: "flex",
                    gap: "12px",
                    fontSize: "1rem",
                    position: "fixed"
                }, children: socialLinks.map(link => (_jsxs("a", { href: link.url, target: "_blank", rel: "noopener noreferrer", style: { textDecoration: "none" }, children: [link.emoji, " ", link.name] }, link.name))) })] }));
}
export default App;
