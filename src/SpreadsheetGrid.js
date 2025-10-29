import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ALL THESE CODE WERE CREATED BY GPT-5
import React from "react";
import DataEditor, { GridCellKind, } from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
export default function SpreadsheetGrid() {
    const [values, setValues] = React.useState({});
    const [activeCell, setActiveCell] = React.useState(null);
    const [cellValue, setCellValue] = React.useState("");
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
    const handleSave = () => {
        if (activeCell) {
            setValues((prev) => (Object.assign(Object.assign({}, prev), { [activeCell.id]: cellValue })));
            setActiveCell(null);
        }
    };
    // ✅ Export CSV
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
    return (_jsxs("div", { style: { height: "80vh", width: "100%", position: "relative" }, children: [_jsx("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: "8px" }, children: _jsx("button", { onClick: handleExportCSV, children: "\u2B07\uFE0F Export CSV" }) }), _jsx(DataEditor, { columns: columns, rows: totalRows, getCellContent: getCellContent, freezeColumns: 1, freezeTrailingRows: 1, rowHeight: 28, headerHeight: 32, onCellActivated: handleCellActivated }), activeCell && (_jsxs("div", { style: {
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
                }, children: [_jsxs("h3", { children: ["Edit Cell ", activeCell.id] }), _jsx("textarea", { value: cellValue, onChange: (e) => setCellValue(e.target.value), style: { width: "100%", height: "80px", marginBottom: "1rem" } }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsx("button", { onClick: () => setActiveCell(null), style: { marginRight: "0.5rem" }, children: "Cancel" }), _jsx("button", { onClick: handleSave, children: "Save" })] })] }))] }));
}
