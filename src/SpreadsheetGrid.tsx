import React from "react";
import DataEditor, {
  GridCellKind,
  type GridColumn,
  type GridCell,
  type Item,
  DataEditorRef,
  CompactSelection, 
  type GridSelection,
} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";

export default function SpreadsheetGrid({
  fingerPosRef,
}: {
  fingerPosRef: React.RefObject<{ x: number; y: number; label: string; ts: number } | null>;
}) {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const activeCellRef = React.useRef<{ col: number; row: number; id: string } | null>(null);
  const prevFingerPosRef = React.useRef<{ x: number; y: number, label: string, ts:number  } | null>(null);
  const prevVelocityRef = React.useRef<{ vx: number; vy: number; ts:number  } | null>(null);
  const gridRef = React.useRef<DataEditorRef | null>(null);

  const [isEditing, setIsEditing] = React.useState(false);

  const [cellValue, setCellValue] = React.useState("");
  const [fillDirection, setFillDirection] = React.useState<"horizontal" | "vertical">("horizontal");
  const [gridSelection, setGridSelection] = React.useState<GridSelection>();

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

      activeCellRef.current = { col, row, id: cellId };  // no rerender
      console.log('Cell activated:', activeCellRef.current); // <- log her
      setCellValue(values[cellId] ?? "");                // rerenders modal
      setIsEditing(true);                                // show modal

      prevFingerPosRef.current = null;
    },
    [values]
  );


  const handleSave = () => {
    if (!activeCellRef.current) return;

    const parts = cellValue.split(":").map(v => v.trim()).filter(Boolean);

    setValues(prev => {
      const newValues = { ...prev };

      parts.forEach((part, i) => {
        const { col, row } = activeCellRef.current!;

        if (fillDirection === "horizontal") {
          const targetCol = col + i;
          if (targetCol < columns.length) {
            newValues[getCellId(targetCol, row)] = part;
          }
        } else {
          const targetRow = row + i;
          if (targetRow < totalRows) {
            newValues[getCellId(col, targetRow)] = part;
          }
        }
      });

      return newValues;
    });

    setIsEditing(false);   // close modal
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

  // 🎤 --- SPEECH RECOGNITION SETUP ---
  React.useEffect(() => {
  if (!isEditing) return;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  let active = true; // <— add this

  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event:SpeechRecognitionEvent) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    setCellValue(transcript);
  };

  recognition.onend = () => {
    if (active) recognition.start();  // only restart if modal still open
  };

  recognition.start();

  return () => {
    active = false;                   // <— stops auto-restart
    recognition.stop();
  };
}, [isEditing]);


  // cell selection
  React.useEffect(() => {
  const interval = setInterval(() => {
    const pos = fingerPosRef.current;
    if (!pos || pos.label !== "click") return;

    // fallback: use activeCellRef when grid is not focused
    const selected =
      gridSelection?.current?.cell ??
      (activeCellRef.current
        ? [activeCellRef.current.col, activeCellRef.current.row] as [number, number]
        : null);

    if (selected) {
      selectCell(selected[0], selected[1]);
      handleCellActivated(selected);
    }

    pos.label = "";
  }, 100);

  return () => clearInterval(interval);
}, [gridSelection]);

function selectCell(col: number, row: number) {
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



React.useEffect(() => {
  const interval = setInterval(() => {
    const pos = fingerPosRef.current;
    if (!pos || pos.label !== "click") return;

    // 1️⃣ Try selection from state
    let active = gridSelection?.current?.cell;

    // 2️⃣ If no selection, try ref
    if (!active && activeCellRef.current) {
      active = [activeCellRef.current.col, activeCellRef.current.row];
    }

    // 3️⃣ If STILL nothing → default to (1,1)
    if (!active) {
      active = [1, 1];
      selectCell(1, 1);                          // <-- soft selection
      activeCellRef.current = {
        col: 1,
        row: 1,
        id: getCellId(1, 1)
      };
    }

    // 4️⃣ Now activate safely
    selectCell(active[0], active[1]);
    handleCellActivated(active);

    pos.label = ""; // reset click
  }, 100);

  return () => clearInterval(interval);
}, [gridSelection]);


  // 🖐 Finger tracking
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (fingerPosRef.current?.label !== "cursor") return;
      const cur = fingerPosRef.current;
      // Get the current position from the controlled state for reliability
      const currentCol = activeCellRef.current?.col;
      const currentRow = activeCellRef.current?.row;
      if (currentCol == null || currentRow == null) return;

      // Get previous samples
    const prev = prevFingerPosRef.current;
    const prevVel = prevVelocityRef.current;

    // First frame
    if (!prev) {
      prevFingerPosRef.current = { ...cur };
      prevVelocityRef.current = { vx: 0, vy: 0, ts: cur.ts };
      return;
    }

    const dt = (cur.ts - prev.ts) / 1000; // convert ms → seconds
    if (dt <= 0) return;

    const ALPHA = 0.2; // smoothness (smaller = smoother)

    const rawVx = (cur.x - prev.x) / dt;
    const rawVy = (cur.y - prev.y) / dt;

    const vx = prevVel ? prevVel.vx * (1 - ALPHA) + rawVx * ALPHA : rawVx;
    const vy = prevVel ? prevVel.vy * (1 - ALPHA) + rawVy * ALPHA : rawVy;


    // --- First velocity frame ---
    if (!prevVel) {
      prevVelocityRef.current = { vx, vy, ts: cur.ts };
      prevFingerPosRef.current = { ...cur };
      return;
    }

    // --- Acceleration ---
    // const ax = (vx - prevVel.vx) / dt;
    // const ay = (vy - prevVel.vy) / dt;

    // scale to pixel movement
    const SCALE = 200;  // adjust this to your taste
    const moveX = vx * SCALE;
    const moveY = vy * SCALE;

    // threshold to avoid jitter
    if (Math.abs(moveX) + Math.abs(moveY) < 1) {
      prevFingerPosRef.current = { ...cur };
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
        if (moveX > 15) newCol = oldCol + 1; // MOVE RIGHT
        else if (moveX < -15) newCol = oldCol - 1; // MOVE LEFT
      } else {
        // ✨ 2. Vertical move (new logic)
        if (moveY > 15) newRow = oldRow + 1; // MOVE DOWN
        else if (moveY < -15) newRow = oldRow - 1; // MOVE UP
      }

      // ✨ 3. Check if a move was made and if it's within bounds
      const moved = newCol !== oldCol || newRow !== oldRow;
      const inBounds = newCol >= 1 && newCol < columns.length && newRow >= 0 && newRow < totalRows;

      if (moved && inBounds) {
        const newId = getCellId(newCol, newRow);

        // update ref
        activeCellRef.current = { col: newCol, row: newRow, id: newId };

        // update modal
        setCellValue(values[newId] ?? "");

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
        gridRef.current?.scrollTo(newCol, newRow);
      }

      
      // update history
      prevFingerPosRef.current = { ...cur };
      prevVelocityRef.current = { vx, vy, ts: cur.ts };
    }, 150); //50 A slightly faster interval can feel more responsive

    return () => clearInterval(interval);
  }, []);
  return (
    <div style={{ height: "80vh", width: "100%", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "flex-start", gap: "5px", marginBottom: "8px" }}>
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
        ref={gridRef}
        columns={columns}
        rows={totalRows}
        getCellContent={getCellContent}
        freezeColumns={1}
        freezeTrailingRows={1}
        rowHeight={28}
        headerHeight={32}
        onCellActivated={handleCellActivated}
        onCellClicked={(cell) => {
        const [col, row] = cell;
        const cellId = getCellId(col, row);

        // Update the ref whenever a cell is highlighted
        activeCellRef.current = { col, row, id: cellId };

        // Optional: update cellValue for modal or prefill
        setCellValue(values[cellId] ?? "");
        console.log("Cell highlighted:", cellId);
      }}
      gridSelection={gridSelection}
        onGridSelectionChange={setGridSelection}
      />

      {isEditing && activeCellRef.current && (
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
          <h3>Edit Cell {activeCellRef.current.id}</h3>
          <textarea
            value={cellValue}
            onChange={(e) => setCellValue(e.target.value)}
            style={{ width: "100%", height: "80px", marginBottom: "1rem" }}
            placeholder="Speak or type here..."
          />
          <div style={{ textAlign: "right" }}>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
            <button onClick={handleSave}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
function onCellClicked(arg0: { col: number; row: number; }, arg1: { kind: string; button: number; }) {
  throw new Error("Function not implemented.");
}

