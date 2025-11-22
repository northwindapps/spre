import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import DataEditor, { GridCellKind, CompactSelection, } from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
export default function SpreadsheetGrid({ fingerPosRef, }) {
    const [values, setValues] = React.useState({});
    const activeCellRef = React.useRef(null);
    const prevFingerPosRef = React.useRef(null);
    const gridRef = React.useRef(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [cellValue, setCellValue] = React.useState("");
    const [fillDirection, setFillDirection] = React.useState("horizontal");
    const [gridSelection, setGridSelection] = React.useState();
    const totalCols = 26;
    const totalRows = 300;
    const columns = [
        { id: "rowIndex", title: "", width: 50 },
        ...Array.from({ length: totalCols }, (_, i) => {
            const name = String.fromCharCode(65 + i);
            return { id: name, title: name, width: 80 };
        }),
    ];
    const getCellId = (col, row) => {
        const name = columns[col].title;
        return `${name}${row + 1}`;
    };
    const getCellContent = React.useCallback(([col, row]) => {
        var _a;
        if (col === 0) {
            return {
                kind: GridCellKind.Text,
                data: String(row + 1),
                displayData: String(row + 1),
                allowOverlay: false,
            };
        }
        const cellId = getCellId(col, row);
        const value = (_a = values[cellId]) !== null && _a !== void 0 ? _a : "";
        return {
            kind: GridCellKind.Text,
            data: value,
            displayData: value,
            allowOverlay: true,
        };
    }, [columns, values]);
    const handleCellActivated = React.useCallback((cell) => {
        var _a;
        const [col, row] = cell;
        const cellId = getCellId(col, row);
        activeCellRef.current = { col, row, id: cellId }; // no rerender
        console.log('Cell activated:', activeCellRef.current); // <- log her
        setCellValue((_a = values[cellId]) !== null && _a !== void 0 ? _a : ""); // rerenders modal
        setIsEditing(true); // show modal
        prevFingerPosRef.current = null;
    }, [values]);
    const handleSave = () => {
        if (!activeCellRef.current)
            return;
        const parts = cellValue.split(":").map(v => v.trim()).filter(Boolean);
        setValues(prev => {
            const newValues = Object.assign({}, prev);
            parts.forEach((part, i) => {
                const { col, row } = activeCellRef.current;
                if (fillDirection === "horizontal") {
                    const targetCol = col + i;
                    if (targetCol < columns.length) {
                        newValues[getCellId(targetCol, row)] = part;
                    }
                }
                else {
                    const targetRow = row + i;
                    if (targetRow < totalRows) {
                        newValues[getCellId(col, targetRow)] = part;
                    }
                }
            });
            return newValues;
        });
        setIsEditing(false); // close modal
    };
    const handleExportCSV = () => {
        var _a;
        const rows = [];
        for (let row = 0; row < totalRows; row++) {
            const rowValues = [];
            for (let col = 1; col <= totalCols; col++) {
                const cellId = getCellId(col, row);
                rowValues.push((_a = values[cellId]) !== null && _a !== void 0 ? _a : "");
            }
            rows.push(rowValues);
        }
        const csvContent = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "spreadsheet_data.csv");
        link.click();
        URL.revokeObjectURL(url);
    };
    // 🎤 --- SPEECH RECOGNITION SETUP ---
    React.useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition)
            return;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setCellValue(transcript);
        };
        recognition.onend = () => recognition.start(); // auto-restart
        recognition.start();
        return () => recognition.stop();
    }, []);
    // 🖐 Finger tracking
    React.useEffect(() => {
        const interval = setInterval(() => {
            var _a, _b, _c;
            const cur = fingerPosRef.current;
            // Get the current position from the controlled state for reliability
            const currentCell = (_a = gridSelection === null || gridSelection === void 0 ? void 0 : gridSelection.current) === null || _a === void 0 ? void 0 : _a.cell;
            if (!cur || !currentCell) {
                // If we don't have a selection, try to fall back to the ref from the last activation
                if (!cur || !activeCellRef.current)
                    return;
            }
            const prev = prevFingerPosRef.current;
            if (!prev) {
                prevFingerPosRef.current = Object.assign({}, cur);
                return;
            }
            const dx = cur.x - prev.x;
            const dy = cur.y - prev.y;
            const PIXEL_SCALE = 500;
            const dxScaled = dx * PIXEL_SCALE;
            const dyScaled = dy * PIXEL_SCALE;
            const distanceScaled = Math.sqrt(dxScaled * dxScaled + dyScaled * dyScaled);
            // A dead zone to prevent jitter
            if (distanceScaled < 10)
                return;
            // Use the controlled state as the source of truth, with a fallback to the ref
            const oldCol = currentCell ? currentCell[0] : activeCellRef.current.col;
            const oldRow = currentCell ? currentCell[1] : activeCellRef.current.row;
            let newCol = oldCol;
            let newRow = oldRow;
            // ✨ 1. Decide if the move is mostly horizontal or vertical
            if (Math.abs(dxScaled) > Math.abs(dyScaled)) {
                // Horizontal move (your existing logic)
                if (dxScaled > 10)
                    newCol = oldCol + 1; // MOVE RIGHT
                else if (dxScaled < -10)
                    newCol = oldCol - 1; // MOVE LEFT
            }
            else {
                // ✨ 2. Vertical move (new logic)
                if (dyScaled > 10)
                    newRow = oldRow + 1; // MOVE DOWN
                else if (dyScaled < -10)
                    newRow = oldRow - 1; // MOVE UP
            }
            // ✨ 3. Check if a move was made and if it's within bounds
            const moved = newCol !== oldCol || newRow !== oldRow;
            const inBounds = newCol >= 1 && newCol < columns.length && newRow >= 0 && newRow < totalRows;
            if (moved && inBounds) {
                const newId = getCellId(newCol, newRow);
                // update ref
                activeCellRef.current = { col: newCol, row: newRow, id: newId };
                // update modal
                setCellValue((_b = values[newId]) !== null && _b !== void 0 ? _b : "");
                setGridSelection({
                    current: {
                        cell: [newCol, newRow],
                        range: { x: newCol, y: newRow, width: 1, height: 1 },
                        rangeStack: [],
                    },
                    columns: CompactSelection.empty(),
                    rows: CompactSelection.empty(),
                });
                // Optional: You can re-enable scrolling if needed
                (_c = gridRef.current) === null || _c === void 0 ? void 0 : _c.scrollTo(newCol, newRow);
            }
            prevFingerPosRef.current = Object.assign({}, cur);
        }, 50); // A slightly faster interval can feel more responsive
        return () => clearInterval(interval);
    }, [fingerPosRef, columns, values, getCellId, gridSelection, totalRows]); // ✨ Add totalRows
    // 🎤 --- END SPEECH RECOGNITION ---
    return (_jsxs("div", { style: { height: "80vh", width: "100%", position: "relative" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "flex-start", gap: "5px", marginBottom: "8px" }, children: [_jsxs("button", { onClick: () => setFillDirection((prev) => (prev === "horizontal" ? "vertical" : "horizontal")), children: ["\uD83D\uDD04 Direction: ", fillDirection === "horizontal" ? "Horizontal →" : "Vertical ↓"] }), _jsx("button", { onClick: handleExportCSV, children: "\u2B07\uFE0F Export CSV" })] }), _jsx(DataEditor, { ref: gridRef, columns: columns, rows: totalRows, getCellContent: getCellContent, freezeColumns: 1, freezeTrailingRows: 1, rowHeight: 28, headerHeight: 32, onCellActivated: handleCellActivated, onCellClicked: (cell) => {
                    var _a;
                    const [col, row] = cell;
                    const cellId = getCellId(col, row);
                    // Update the ref whenever a cell is highlighted
                    activeCellRef.current = { col, row, id: cellId };
                    // Optional: update cellValue for modal or prefill
                    setCellValue((_a = values[cellId]) !== null && _a !== void 0 ? _a : "");
                    console.log("Cell highlighted:", cellId);
                }, gridSelection: gridSelection, onGridSelectionChange: setGridSelection }), isEditing && activeCellRef.current && (_jsxs("div", { style: {
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "white",
                    padding: "1rem",
                    borderRadius: "10px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    zIndex: 10,
                    width: "300px",
                }, children: [_jsxs("h3", { children: ["Edit Cell ", activeCellRef.current.id] }), _jsx("textarea", { value: cellValue, onChange: (e) => setCellValue(e.target.value), style: { width: "100%", height: "80px", marginBottom: "1rem" }, placeholder: "Speak or type here..." }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsx("button", { onClick: () => setIsEditing(false), children: "Cancel" }), _jsx("button", { onClick: handleSave, children: "Save" })] })] }))] }));
}
