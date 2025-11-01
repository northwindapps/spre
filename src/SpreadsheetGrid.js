import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import DataEditor, { GridCellKind, } from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
export default function SpreadsheetGrid() {
    const [values, setValues] = React.useState({});
    const [activeCell, setActiveCell] = React.useState(null);
    const [cellValue, setCellValue] = React.useState("");
    const [fillDirection, setFillDirection] = React.useState("horizontal");
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
        setActiveCell({ col, row, id: cellId });
        setCellValue((_a = values[cellId]) !== null && _a !== void 0 ? _a : "");
    }, [values]);
    // ✅ Updated: Support horizontal/vertical direction filling
    const handleSave = () => {
        if (!activeCell)
            return;
        const parts = cellValue.split(":").map((v) => v.trim()).filter(Boolean);
        setValues((prev) => {
            const newValues = Object.assign({}, prev);
            parts.forEach((part, i) => {
                if (fillDirection === "horizontal") {
                    const targetCol = activeCell.col + i;
                    if (targetCol < columns.length) {
                        const targetId = getCellId(targetCol, activeCell.row);
                        newValues[targetId] = part;
                    }
                }
                else {
                    const targetRow = activeCell.row + i;
                    if (targetRow < totalRows) {
                        const targetId = getCellId(activeCell.col, targetRow);
                        newValues[targetId] = part;
                    }
                }
            });
            return newValues;
        });
        setActiveCell(null);
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
    return (_jsxs("div", { style: { height: "80vh", width: "100%", position: "relative" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "flex-start", gap: "5px", marginBottom: "8px" }, children: [_jsxs("button", { onClick: () => setFillDirection((prev) => (prev === "horizontal" ? "vertical" : "horizontal")), children: ["\uD83D\uDD04 Direction: ", fillDirection === "horizontal" ? "Horizontal →" : "Vertical ↓"] }), _jsx("button", { onClick: handleExportCSV, children: "\u2B07\uFE0F Export CSV" })] }), _jsx(DataEditor, { columns: columns, rows: totalRows, getCellContent: getCellContent, freezeColumns: 1, freezeTrailingRows: 1, rowHeight: 28, headerHeight: 32, onCellActivated: handleCellActivated }), activeCell && (_jsxs("div", { style: {
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
                }, children: [_jsxs("h3", { children: ["Edit Cell ", activeCell.id] }), _jsx("textarea", { value: cellValue, onChange: (e) => setCellValue(e.target.value), style: { width: "100%", height: "80px", marginBottom: "1rem" }, placeholder: "Enter values separated by colones (e.g., dog:cat:monkey)" }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsx("button", { onClick: () => setActiveCell(null), style: { marginRight: "0.5rem" }, children: "Cancel" }), _jsx("button", { onClick: handleSave, children: "Save" })] })] }))] }));
}
