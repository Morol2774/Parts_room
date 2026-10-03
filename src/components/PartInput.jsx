import React, { useEffect, useRef, useState } from "react";
import { stockTone } from "../lib/utils.js";

/** Part number field with autocomplete (↑ ↓ Enter Esc). */
export default function PartInput({ value, onChange, parts, error }) {
  const [q, setQ] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);

  // close on click outside
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const hits = q.trim().length < 1 ? [] :
    parts.filter((p) =>
      p.code.toLowerCase().includes(q.toLowerCase()) ||
      p.name.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8);

  const pick = (p) => { setQ(p.code); onChange(p.code); setOpen(false); };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && open && hits[idx]) { e.preventDefault(); pick(hits[idx]); }
    else if (e.key === "Escape") setOpen(false);
  };

  const matched = parts.find((p) => p.code === q.trim().toUpperCase());

  return (
    <div ref={ref} className="ac">
      <div className="input-wrap">
        <input
          className={`input mono ${matched ? "is-ok" : error ? "is-err" : ""}`}
          style={{ paddingRight: 40 }}
          value={q}
          onChange={(e) => { const v = e.target.value.toUpperCase(); setQ(v); onChange(v); setOpen(true); setIdx(0); }}
          onFocus={() => { if (q.length > 0) setOpen(true); }}
          onKeyDown={onKey}
          placeholder="Part Number or name (e.g. SCR-IP14)…"
          autoComplete="off"
          spellCheck="false"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-autocomplete="list"
        />
        {matched && <span className="trail ok" aria-hidden="true"><i className="fa-solid fa-circle-check" /></span>}
      </div>

      {open && hits.length > 0 && (
        <div className="ac-list" role="listbox">
          {hits.map((p, i) => (
            <div
              key={p.code}
              role="option"
              aria-selected={i === idx}
              className={`ac-item ${i === idx ? "on" : ""}`}
              onMouseDown={() => pick(p)}
              onMouseEnter={() => setIdx(i)}
            >
              <span className="code">{p.code}</span>
              <span className="name">{p.name}</span>
              <span className="meta">
                <i className="fa-solid fa-tag" />{p.location}
                <span className="dot">·</span>
                <b className={`mono t-${stockTone(p.qty)}`}>{p.qty}</b> pcs
              </span>
            </div>
          ))}
        </div>
      )}

      {matched && (
        <div className="part-info">
          <i className="fa-solid fa-tag" />{matched.location}
          <span className="dot">·</span>Stock:
          <b className={`t-${stockTone(matched.qty)}`}>{matched.qty} pcs</b>
          <span className="dot">·</span>{matched.name}
        </div>
      )}
      {q.length > 2 && !matched && !open && (
        <div className="warn-text" style={{ marginTop: 6 }}>
          <i className="fa-solid fa-triangle-exclamation" />Part Number not found in database — can submit as is
        </div>
      )}
    </div>
  );
}
