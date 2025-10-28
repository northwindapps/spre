import React from "react";
import DataEditor, { GridCellKind, type GridColumn, type GridCell, type Item } from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";

export default function SpreadsheetGrid() {
 const columns: GridColumn[] = [
  { id: "rowIndex", title: "", width: 50 }, // fixed index column
   ...Array.from({ length: 26 }, (_, i) => {
    const name = String.fromCharCode(65 + i);
    return { id: name, title: name, width: 80 };
   }),
 ];

 const getCellContent = React.useCallback(
  ([col, row]: Item): GridCell => {
    if (col === 0) {
      // first column: row index
      return {
        kind: GridCellKind.Text,
        data: String(row + 1),
        displayData: String(row + 1),
        allowOverlay: false,
      };
    }

    // other columns
    const column = columns[col];
    return {
      kind: GridCellKind.Text,
      data: `${column.title}${row + 1}`,
      displayData: `${column.title}${row + 1}`,
      allowOverlay: true,
    };
  },
  [columns]
);


  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <DataEditor
        columns={columns}
        rows={300}
        getCellContent={getCellContent}
        freezeColumns={1}
        freezeTrailingRows={1}
        rowHeight={28}
        headerHeight={32}
      />
    </div>
  );
}
