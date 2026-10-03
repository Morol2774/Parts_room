// Thin wrappers around the global SheetJS build (loaded in index.html).

function xlsx() {
  if (!window.XLSX) throw new Error("Excel library didn't load — check the internet connection and reload the page.");
  return window.XLSX;
}

/** rows: array of plain objects; widths: column widths in characters. */
export function writeSheet(rows, widths, sheetName, fileName) {
  const XLSX = xlsx();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = widths.map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

/** Reads the first sheet of an uploaded file → array of row objects. */
export function readFirstSheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const XLSX = xlsx();
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}
