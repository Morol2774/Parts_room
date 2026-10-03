import React, { useState } from "react";
import ExportMorph from "../components/morph/ExportMorph.jsx";
import { AccessLine, Field, SearchBox, Stat, Stepper } from "../components/ui.jsx";
import { stockTone } from "../lib/utils.js";

const blank = { code: "", name: "", location: "", qty: 0 };

/** Warehouse stock list. */
export default function InventoryView({ parts, setParts, isAuth, onAuth, exportParts, importParts }) {
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null); // null | "new" | part code
  const [form, setForm] = useState(blank);

  const list = parts.filter((p) => [p.code, p.name, p.location].some((v) => v.toLowerCase().includes(search.toLowerCase())));
  const lowN = parts.filter((p) => p.qty <= 5).length;

  const save = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    setParts((p) => {
      const ex = p.find((x) => x.code === form.code);
      return ex ? p.map((x) => (x.code === form.code ? { ...form, qty: Number(form.qty) } : x)) : [...p, { ...form, qty: Number(form.qty) }];
    });
    setEdit(null);
  };

  const adj = (code, d) => setParts((p) => p.map((x) => (x.code === code ? { ...x, qty: Math.max(0, x.qty + d) } : x)));

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2 className="title"><i className="fa-solid fa-boxes-stacked t-acc" />Warehouse Inventory</h2>
          <p className="sub"><AccessLine isAuth={isAuth} onAuth={onAuth} loginText="Login" /></p>
        </div>
        <div className="stats">
          <Stat value={parts.length} label="items" tone="acc" />
          <Stat value={lowN} label="low (≤5)" tone={lowN ? "bad" : "ok"} />
        </div>
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by Part Number, name, location…" />
        <ExportMorph run={exportParts} />
        {isAuth && (
          <label className="btn">
            <i className="fa-solid fa-upload" />Upload Excel
            <input type="file" accept=".xlsx,.xls" onChange={importParts} />
          </label>
        )}
        {isAuth && (
          <button type="button" className="btn primary" onClick={() => { setEdit("new"); setForm(blank); }}>
            <i className="fa-solid fa-plus" />Add Item
          </button>
        )}
      </div>

      <div className="note">
        <i className="fa-solid fa-circle-check" />
        <span>Excel import format: columns <b>Part Number</b>, <b>Part Name</b>, <b>Location</b>, <b>Stock</b></span>
      </div>

      {edit && (
        <div className="edit-panel">
          <div className="lbl-title">
            <i className={`fa-solid ${edit === "new" ? "fa-plus" : "fa-pen"}`} />{edit === "new" ? "New Item" : "Edit Item"}
          </div>
          <div className="grid-2">
            {[["code", "Part Number *"], ["name", "Part Name *"], ["location", "Warehouse Location"]].map(([f, l]) => (
              <Field key={f} label={l}>
                <input
                  className={`input ${f !== "name" ? "mono" : ""}`}
                  value={form[f]}
                  onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                  disabled={f === "code" && edit !== "new"}
                  placeholder={f === "code" ? "SCR-IP14-001" : f === "location" ? "A1-S3" : ""}
                />
              </Field>
            ))}
            <Field label="Stock (pcs)">
              <input className="input" type="number" min="0" value={form.qty} onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))} />
            </Field>
          </div>
          <div className="row" style={{ marginTop: 18 }}>
            <button type="button" className="btn t-ok" onClick={save}><i className="fa-solid fa-check" />Save</button>
            <button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Part Number</th>
              <th>Part Name</th>
              <th className="hide-sm">Location</th>
              <th className="c">Stock</th>
              <th className="r" aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.code} className={p.qty <= 5 ? "low" : ""}>
                <td className="code">{p.code}</td>
                <td>{p.name}</td>
                <td className="loc hide-sm">{p.location}</td>
                <td className="c">
                  <Stepper
                    qty={p.qty}
                    tone={stockTone(p.qty)}
                    onMinus={isAuth ? () => adj(p.code, -1) : onAuth}
                    onPlus={isAuth ? () => adj(p.code, 1) : onAuth}
                  />
                </td>
                <td className="r">
                  {isAuth && (
                    <button type="button" className="btn icon sm" onClick={() => { setEdit(p.code); setForm({ ...p }); }} title="Edit" aria-label={`Edit ${p.code}`}>
                      <i className="fa-solid fa-pen" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <div className="empty">Nothing found</div>}
      </div>
    </section>
  );
}
