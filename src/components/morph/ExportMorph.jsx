import React, { useEffect, useRef, useState } from "react";

/**
 * Morph #5 · Export → progress fill → "file.xlsx ✓".
 * check()  — runs first; return false to cancel (it shows its own toast).
 * run()    — does the export after the fill; returns the short file label
 *            to show, or null on failure.
 */
export default function ExportMorph({ label = "Download Excel", check, run, className = "" }) {
  const [st, setSt] = useState("idle"); // idle | run | fin
  const [file, setFile] = useState("");
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const click = () => {
    if (st !== "idle") return;
    if (check && !check()) return;
    setSt("run");
    later(() => {
      const name = run();
      if (!name) { setSt("idle"); return; }
      setFile(name);
      setSt("fin");
      later(() => setSt("idle"), 2000);
    }, 950);
  };

  return (
    <button type="button" className={`btn morph export ${st === "idle" ? "" : st === "fin" ? "run fin" : "run"} ${className}`} onClick={click} aria-live="polite" data-audit="export">
      <span className="fill" />
      <span className="xlbl">
        {st === "idle" && <><i className="fa-solid fa-download" />{label}</>}
        {st === "run" && <><i className="fa-solid fa-file-excel" />Preparing…</>}
        {st === "fin" && <><i className="fa-solid fa-check" />{file}</>}
      </span>
    </button>
  );
}
