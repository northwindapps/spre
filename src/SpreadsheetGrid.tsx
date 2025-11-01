import React from "react";
import DataEditor, {
  GridCellKind,
  type GridColumn,
  type GridCell,
  type Item,
} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";

export default function SpreadsheetGrid() {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [activeCell, setActiveCell] = React.useState<{ col: number; row: number; id: string } | null>(null);
  const [cellValue, setCellValue] = React.useState("");
  const [fillDirection, setFillDirection] = React.useState<"horizontal" | "vertical">("horizontal");

  const totalCols = 26;
  const totalRows = 300;

  const columns: GridColumn[] = [
    { id: "rowIndex", title: "", width: 50 },
    ...Array.from({ length: totalCols }, (_, i) => {
      const name = String.fromCharCode(65 + i);
      return { id: name, title: name, width: 80 };
    }),
  ];

  const getCellId = (col: number, row: number) => {
    const name = columns[col].title;
    return `${name}${row + 1}`;
  };

  const getCellContent = React.useCallback(
    ([col, row]: Item): GridCell => {
      if (col === 0) {
        return {
          kind: GridCellKind.Text,
          data: String(row + 1),
          displayData: String(row + 1),
          allowOverlay: false,
        };
      }

      const cellId = getCellId(col, row);
      const value = values[cellId] ?? "";
      return {
        kind: GridCellKind.Text,
        data: value,
        displayData: value,
        allowOverlay: true,
      };
    },
    [columns, values]
  );

  const handleCellActivated = React.useCallback(
    (cell: Item) => {
      const [col, row] = cell;
      const cellId = getCellId(col, row);
      setActiveCell({ col, row, id: cellId });
      setCellValue(values[cellId] ?? "");
    },
    [values]
  );

  // ✅ Updated: Support horizontal/vertical direction filling
  const handleSave = () => {
    if (!activeCell) return;

    const parts = cellValue.split(",").map((v) => v.trim()).filter(Boolean);

    setValues((prev) => {
      const newValues = { ...prev };

      parts.forEach((part, i) => {
        if (fillDirection === "horizontal") {
          const targetCol = activeCell.col + i;
          if (targetCol < columns.length) {
            const targetId = getCellId(targetCol, activeCell.row);
            newValues[targetId] = part;
          }
        } else {
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
    const rows: string[][] = [];

    for (let row = 0; row < totalRows; row++) {
      const rowValues: string[] = [];
      for (let col = 1; col <= totalCols; col++) {
        const cellId = getCellId(col, row);
        rowValues.push(values[cellId] ?? "");
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

  return (
    <div style={{ height: "80vh", width: "100%", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "flex-start", gap:"5px", marginBottom: "8px" }}>
        <button
          onClick={() =>
            setFillDirection((prev) => (prev === "horizontal" ? "vertical" : "horizontal"))
          }
        >
          🔄 Direction: {fillDirection === "horizontal" ? "Horizontal →" : "Vertical ↓"}
        </button>
        <button onClick={handleExportCSV}>⬇️ Export CSV</button>
      </div>

      <DataEditor
        columns={columns}
        rows={totalRows}
        getCellContent={getCellContent}
        freezeColumns={1}
        freezeTrailingRows={1}
        rowHeight={28}
        headerHeight={32}
        onCellActivated={handleCellActivated}
      />

      {activeCell && (
        <div
          style={{
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
          }}
        >
          <h3>Edit Cell {activeCell.id}</h3>
          <textarea
            value={cellValue}
            onChange={(e) => setCellValue(e.target.value)}
            style={{ width: "100%", height: "80px", marginBottom: "1rem" }}
            placeholder="Enter values separated by commas (e.g., dog,cat,monkey)"
          />
          <div style={{ textAlign: "right" }}>
            <button onClick={() => setActiveCell(null)} style={{ marginRight: "0.5rem" }}>
              Cancel
            </button>
            <button onClick={handleSave}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
