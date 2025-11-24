import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import DataEditor, { GridCellKind, CompactSelection, } from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
export default function SpreadsheetGrid({ fingerPosRef, }) {
    const [values, setValues] = React.useState({});
    const activeCellRef = React.useRef(null);
    const prevFingerPosRef = React.useRef(null);
    const prevVelocityRef = React.useRef(null);
    const gridRef = React.useRef(null);
    const latestTranscriptRef = React.useRef("");
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
    const handleSave = (cellSnapshot = activeCellRef.current, value) => {
        if (!cellSnapshot)
            return;
        const { col, row } = cellSnapshot;
        const text = ((value !== null && value !== void 0 ? value : cellValue) || "").trim(); // use value if provided
        if (!text) {
            setValues(prev => (Object.assign(Object.assign({}, prev), { [getCellId(col, row)]: "" })));
            setIsEditing(false);
            return;
        }
        const parts = text.split(":").map(v => v.trim()).filter(Boolean);
        setValues(prev => {
            const newValues = Object.assign({}, prev);
            parts.forEach((part, i) => {
                if (fillDirection === "horizontal") {
                    const targetCol = col + i;
                    if (targetCol < columns.length)
                        newValues[getCellId(targetCol, row)] = part;
                }
                else {
                    const targetRow = row + i;
                    if (targetRow < totalRows)
                        newValues[getCellId(col, targetRow)] = part;
                }
            });
            return newValues;
        });
        setIsEditing(false);
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
        if (!isEditing)
            return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition)
            return;
        const recognition = new SpeechRecognition();
        let active = true; // <— add this
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setCellValue(transcript);
            // testing
            if (transcript !== '') {
                latestTranscriptRef.current = transcript;
            }
        };
        recognition.onend = () => {
            if (active)
                recognition.start(); // only restart if modal still open
        };
        recognition.start();
        return () => {
            active = false; // <— stops auto-restart
            recognition.stop();
        };
    }, [isEditing]);
    // cell selection
    //   React.useEffect(() => {
    //   const interval = setInterval(() => {
    //     const pos = fingerPosRef.current;
    //     if (!pos || pos.label !== "click") return;
    //     // fallback: use activeCellRef when grid is not focused
    //     const selected =
    //       gridSelection?.current?.cell ??
    //       (activeCellRef.current
    //         ? [activeCellRef.current.col, activeCellRef.current.row] as [number, number]
    //         : null);
    //     if (selected) {
    //       selectCell(selected[0], selected[1]);
    //       handleCellActivated(selected);
    //     }
    //     pos.label = "";
    //   }, 100);
    //   return () => clearInterval(interval);
    // }, [gridSelection]);
    function selectCell(col, row) {
        const id = getCellId(col, row);
        // update ref (does NOT rerender)
        activeCellRef.current = { col, row, id };
        // update selection (this updates UI)
        setGridSelection({
            current: {
                cell: [col, row],
                range: { x: col, y: row, width: 1, height: 1 },
                rangeStack: [],
            },
            columns: CompactSelection.empty(),
            rows: CompactSelection.empty(),
        });
    }
    // 🖐 Finger tracking
    React.useEffect(() => {
        const interval = setInterval(() => {
            var _a, _b, _c, _d, _e;
            if (((_a = fingerPosRef.current) === null || _a === void 0 ? void 0 : _a.label) !== "cursor")
                return;
            const cur = fingerPosRef.current;
            // Get the current position from the controlled state for reliability
            const currentCol = (_b = activeCellRef.current) === null || _b === void 0 ? void 0 : _b.col;
            const currentRow = (_c = activeCellRef.current) === null || _c === void 0 ? void 0 : _c.row;
            if (currentCol == null || currentRow == null)
                return;
            // Get previous samples
            const prev = prevFingerPosRef.current;
            const prevVel = prevVelocityRef.current;
            // First frame
            if (!prev) {
                prevFingerPosRef.current = Object.assign({}, cur);
                prevVelocityRef.current = { vx: 0, vy: 0, ts: cur.ts };
                return;
            }
            const dt = (cur.ts - prev.ts) / 1000; // convert ms → seconds
            if (dt <= 0)
                return;
            const ALPHA = 0.2; // smoothness (smaller = smoother)
            const rawVx = (cur.x - prev.x) / dt;
            const rawVy = (cur.y - prev.y) / dt;
            const vx = prevVel ? prevVel.vx * (1 - ALPHA) + rawVx * ALPHA : rawVx;
            const vy = prevVel ? prevVel.vy * (1 - ALPHA) + rawVy * ALPHA : rawVy;
            // --- First velocity frame ---
            if (!prevVel) {
                prevVelocityRef.current = { vx, vy, ts: cur.ts };
                prevFingerPosRef.current = Object.assign({}, cur);
                return;
            }
            // --- Acceleration ---
            // const ax = (vx - prevVel.vx) / dt;
            // const ay = (vy - prevVel.vy) / dt;
            // scale to pixel movement
            const SCALE = 200; // adjust this to your taste
            const moveX = vx * SCALE;
            const moveY = vy * SCALE;
            // threshold to avoid jitter
            if (Math.abs(moveX) + Math.abs(moveY) < 1) {
                prevFingerPosRef.current = Object.assign({}, cur);
                prevVelocityRef.current = { vx, vy, ts: cur.ts };
                return;
            }
            // Use the controlled state as the source of truth, with a fallback to the ref
            let oldCol = currentCol;
            let oldRow = currentRow;
            let newCol = oldCol;
            let newRow = oldRow;
            // ✨ 1. Decide if the move is mostly horizontal or vertical
            if (Math.abs(moveX) > Math.abs(moveY)) {
                // Horizontal move (your existing logic)
                if (moveX > 15)
                    newCol = oldCol + 1; // MOVE RIGHT
                else if (moveX < -15)
                    newCol = oldCol - 1; // MOVE LEFT
            }
            else {
                // ✨ 2. Vertical move (new logic)
                if (moveY > 15)
                    newRow = oldRow + 1; // MOVE DOWN
                else if (moveY < -15)
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
                setCellValue((_d = values[newId]) !== null && _d !== void 0 ? _d : "");
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
                (_e = gridRef.current) === null || _e === void 0 ? void 0 : _e.scrollTo(newCol, newRow);
            }
            // update history
            prevFingerPosRef.current = Object.assign({}, cur);
            prevVelocityRef.current = { vx, vy, ts: cur.ts };
        }, 150); //50 A slightly faster interval can feel more responsive
        return () => clearInterval(interval);
    }, []);
    React.useEffect(() => {
        const interval = setInterval(() => {
            var _a, _b;
            const pos = fingerPosRef.current;
            if (!pos)
                return;
            if (pos.label === "ok" && isEditing) {
                const snapshot = activeCellRef.current;
                handleSave(snapshot, latestTranscriptRef.current);
                pos.label = "";
                return;
            }
            if (pos.label === "cancel" && isEditing) {
                setIsEditing(false);
                pos.label = "";
                return;
            }
            if (isEditing)
                return;
            if (pos.label == "click") {
                let active = (_b = (_a = gridSelection === null || gridSelection === void 0 ? void 0 : gridSelection.current) === null || _a === void 0 ? void 0 : _a.cell) !== null && _b !== void 0 ? _b : (activeCellRef.current
                    ? [activeCellRef.current.col, activeCellRef.current.row]
                    : null);
                if (!active) {
                    active = [1, 1];
                    selectCell(1, 1);
                }
                selectCell(active[0], active[1]);
                handleCellActivated(active);
                pos.label = "";
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isEditing, gridSelection]);
    const manualHandleSave = () => { if (!activeCellRef.current)
        return; const parts = cellValue.split(":").map(v => v.trim()).filter(Boolean); setValues(prev => { const newValues = Object.assign({}, prev); parts.forEach((part, i) => { const { col, row } = activeCellRef.current; if (fillDirection === "horizontal") {
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
    } }); return newValues; }); setIsEditing(false); };
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
                }, children: [_jsxs("h3", { children: ["Edit Cell ", activeCellRef.current.id] }), _jsx("textarea", { value: cellValue, onChange: (e) => {
                            setCellValue(e.target.value); // update state
                            console.log("Textarea changed:", e.target.value); // log new value
                        }, style: { width: "100%", height: "80px", marginBottom: "1rem" }, placeholder: "Speak or type here..." }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsx("button", { onClick: () => setIsEditing(false), children: "Cancel" }), _jsx("button", { onClick: manualHandleSave, children: "Save" })] })] }))] }));
}
