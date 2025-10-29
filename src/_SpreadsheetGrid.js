import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import DataEditor, { GridCellKind, } from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
export default function SpreadsheetGrid() {
    const columns = [
        { id: "rowIndex", title: "", width: 50 }, // fixed index column
        ...Array.from({ length: 26 }, (_, i) => {
            const name = String.fromCharCode(65 + i);
            return { id: name, title: name, width: 80 };
        }),
    ];
    const getCellContent = React.useCallback(([col, row]) => {
        if (col === 0) {
            // first column: row index
            return {
                kind: GridCellKind.Text,
                data: String(row + 1),
                displayData: String(row + 1),
                allowOverlay: false,
            };
        }
        const column = columns[col];
        return {
            kind: GridCellKind.Text,
            data: `${column.title}${row + 1}`,
            displayData: "",
            allowOverlay: true,
        };
    }, [columns]);
    // ✅ Handle tap/click on a cell
    const handleCellActivated = React.useCallback((cell) => {
        const [col, row] = cell;
        const column = columns[col];
        const cellId = `${column.title}${row + 1}`;
        console.log("Cell tapped:", cellId);
        // Example: alert or custom logic
        alert(`You tapped cell ${cellId}`);
    }, [columns]);
    return (_jsx("div", { style: { height: "80vh", width: "100%" }, children: _jsx(DataEditor, { columns: columns, rows: 300, getCellContent: getCellContent, freezeColumns: 1, freezeTrailingRows: 1, rowHeight: 28, headerHeight: 32, onCellActivated: handleCellActivated }) }));
}
