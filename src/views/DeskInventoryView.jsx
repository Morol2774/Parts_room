import React, { useEffect, useState } from "react";
import ExportMorph from "../components/morph/ExportMorph.jsx";
import { Field, SearchBox, Stat, Stepper } from "../components/ui.jsx";
import { readFirstSheet, writeSheet } from "../lib/excel.js";
import { today } from "../lib/utils.js";

const SUBS = ["Good Part Location", "Consumed Good Part"];
const blankForm = { partCode: "", partName: "", qty: 0, max: 10, tableNo: "", employeeName: "", subinventory: SUBS[0] };

// status → tone + label + icon
const SC = {
  green: { tone: "ok", label: "OK", icon: "fa-circle-check" },
  yellow: { tone: "warn", label: "Low", icon: "fa-triangle-exclamation" },
  red: { tone: "bad", label: "Critical", icon: "fa-circle-xmark" },
  excess: { tone: "violet", label: "Overstock!", icon: "fa-triangle-exclamation" },
  gray: { tone: "muted", label: "—", icon: "fa-circle" },
};

const getStatus = (qty, max) => {
  if (max <= 0) return "gray";
  const pct = qty / max;
  return pct >= 0.6 ? "green" : pct >= 0.3 ? "yellow" : "red";
};

const newId = () => `DI-${Date.now()}-${Math.floor(Math.random() * 999)}`;

/** Parts kept at each workstation (staff only). */
export default function DeskInventoryView({ deskInv, setDeskInv, orders, parts, isAuth, onAuth, notify }) {
  const [search, setSearch] = useState("");
  const [filterTable, setFilterTable] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSub, setFilterSub] = useState("all");
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(blankForm);

  // auto-add desk rows for parts in pending orders
  useEffect(() => {
    const toAdd = [];
    orders.filter((o) => o.status === "pending").forEach((o) => {
      o.items.filter((it) => !it.removed).forEach((it) => {
        const code = it.code.toUpperCase();
        const table = String(o.tableNo).toUpperCase();
        const exists = deskInv.some((d) => d.partCode === code && String(d.tableNo).toUpperCase() === table);
        const queued = toAdd.some((d) => d.partCode === code && String(d.tableNo).toUpperCase() === table);
        if (!exists && !queued) {
          const match = parts.find((p) => p.code === code);
          toAdd.push({
            id: `DI-AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            partCode: code,
            partName: it.name || match?.name || code,
            qty: 0,
            max: 10,
            tableNo: table,
            employeeName: o.employeeName.toUpperCase(),
            subinventory: SUBS[0],
            isNew: true,
          });
        }
      });
    });
    if (toAdd.length) setDeskInv((prev) => [...prev, ...toAdd]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // live view of pending orders for this part / table / employee
  const getOrderedInfo = (partCode, tableNo, employeeName) => {
    let total = 0;
    const matched = [];
    orders
      .filter((o) => o.status === "pending" &&
        String(o.tableNo).toUpperCase() === String(tableNo).toUpperCase() &&
        o.employeeName.toUpperCase() === String(employeeName).toUpperCase())
      .forEach((o) => o.items
        .filter((it) => !it.removed && it.code === String(partCode).toUpperCase())
        .forEach((it) => { total += it.qty; matched.push({ orderId: o.id, qty: it.qty, createdAt: o.createdAt }); }));
    return { total, matched };
  };

  const tables = [...new Set(deskInv.map((d) => d.tableNo))].sort();

  const enriched = deskInv.map((d) => {
    const { total: ordered, matched: orderedOrders } = getOrderedInfo(d.partCode, d.tableNo, d.employeeName);
    const projected = d.qty + ordered;
    const excess = Math.max(0, projected - d.max);
    const status = getStatus(d.qty, d.max);
    const overOrder = d.qty > d.max || (ordered > 0 && projected > d.max);
    return { ...d, ordered, orderedOrders, projected, excess, status, overOrder };
  });

  const list = enriched.filter((d) => {
    if (filterTable !== "all" && d.tableNo !== filterTable) return false;
    if (filterStatus === "new" && !d.isNew) return false;
    if (filterStatus === "overorder" && !d.overOrder) return false;
    if (filterStatus !== "all" && filterStatus !== "overorder" && filterStatus !== "new" && (d.overOrder || d.status !== filterStatus)) return false;
    if (filterSub !== "all" && d.subinventory !== filterSub) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![d.partCode, d.partName, d.tableNo, d.employeeName, d.subinventory].some((v) => String(v).toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const overOrderCount = enriched.filter((d) => d.overOrder).length;
  const newCount = enriched.filter((d) => d.isNew).length;
  const redCount = enriched.filter((d) => d.status === "red" && !d.isNew).length;
  const yellowCount = enriched.filter((d) => d.status === "yellow" && !d.isNew).length;

  const openNew = () => { if (!isAuth) { onAuth(); return; } setForm(blankForm); setEdit("new"); };
  const openEdit = (item) => { if (!isAuth) { onAuth(); return; } setForm({ ...item }); setEdit(item.id); };

  const save = () => {
    if (!form.partCode.trim() || !form.tableNo.trim() || !form.employeeName.trim()) { notify("Fill required fields", false); return; }
    const code = form.partCode.trim().toUpperCase();
    const match = parts.find((p) => p.code === code);
    const entry = {
      ...form,
      id: edit === "new" ? newId() : form.id,
      partCode: code,
      partName: form.partName.trim() || match?.name || code,
      qty: Math.max(0, Number(form.qty) || 0),
      max: Math.max(1, Number(form.max) || 10),
      isNew: false,
    };
    if (edit === "new") setDeskInv((p) => [...p, entry]);
    else setDeskInv((p) => p.map((x) => (x.id === edit ? entry : x)));
    setEdit(null);
    notify("Saved");
  };

  const remove = (id) => {
    if (!isAuth) { onAuth(); return; }
    if (!window.confirm("Delete this record?")) return;
    setDeskInv((p) => p.filter((x) => x.id !== id));
    notify("Record deleted");
  };

  const adjQty = (id, d) => {
    if (!isAuth) { onAuth(); return; }
    setDeskInv((p) => p.map((x) => (x.id === id ? { ...x, qty: Math.max(0, x.qty + d) } : x)));
  };

  const checkExport = () => {
    if (!deskInv.length) { notify("No data to export", false); return false; }
    return true;
  };
  const exportDesk = () => {
    try {
      writeSheet(
        deskInv.map((d) => ({
          "Part Number": d.partCode, "Part Name": d.partName, Qty: d.qty, Max: d.max,
          "Table No": d.tableNo, Name: d.employeeName, Subinventory: d.subinventory,
        })),
        [18, 28, 8, 6, 8, 14, 22], "By Table", `desk_inventory_${today()}.xlsx`,
      );
      return "desk_inventory.xlsx";
    } catch (e) { notify(e.message, false); return null; }
  };

  const importDesk = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    readFirstSheet(file).then((rows) => {
      const mapped = rows.map((r) => ({
        id: newId(),
        partCode: String(r["Part Number"] || r.partCode || "").trim().toUpperCase(),
        partName: String(r["Part Name"] || r.partName || "").trim(),
        qty: Math.max(0, Number(r.Qty || r.qty || 0)),
        max: Math.max(1, Number(r.Max || r.max || 10)),
        tableNo: String(r["Table No"] || r.tableNo || "").trim().toUpperCase(),
        employeeName: String(r.Name || r.employeeName || "").trim().toUpperCase(),
        subinventory: String(r.Subinventory || r.subinventory || SUBS[0]).trim(),
      })).filter((r) => r.partCode && r.tableNo);
      if (!mapped.length) { notify("No rows found in file", false); return; }
      setDeskInv(mapped);
      notify(`Loaded ${mapped.length} items`);
    }).catch(() => notify("File read error", false));
    e.target.value = "";
  };

  const chips = [
    ["all", "All", null],
    ["new", "New", newCount],
    ["green", "OK", null],
    ["yellow", "Low", null],
    ["red", "Critical", null],
    ["overorder", "Overstock", overOrderCount],
  ];
  const chipTone = { new: "acc", green: "ok", yellow: "warn", red: "bad", overorder: "violet", all: "acc" };

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2 className="title"><i className="fa-solid fa-table-cells-large t-acc" />Table Inventory</h2>
          <p className="sub">Parts tracking at workstations · warehouse staff only</p>
        </div>
        <div className="stats">
          {redCount > 0 && <Stat value={redCount} label="critical" tone="bad" />}
          {yellowCount > 0 && <Stat value={yellowCount} label="low" tone="warn" />}
          {overOrderCount > 0 && <Stat value={overOrderCount} label="overstock" tone="violet" />}
        </div>
      </div>

      <div className="toolbar">
        <ExportMorph check={checkExport} run={exportDesk} />
        <label className="btn">
          <i className="fa-solid fa-upload" />Upload Excel
          <input type="file" accept=".xlsx,.xls" onChange={importDesk} />
        </label>
        <span className="spacer" />
        <button type="button" className="btn primary" onClick={openNew}><i className="fa-solid fa-plus" />Add</button>
      </div>

      <div className="note">
        <i className="fa-solid fa-circle-check" />
        <span>Excel format: <b>Part Number</b>, <b>Part Name</b>, <b>Qty</b>, <b>Max</b>, <b>Table No</b>, <b>Name</b>, <b>Subinventory</b></span>
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by Part Number, name, table, location…" />
        {tables.length > 0 && (
          <select className="input" value={filterTable} onChange={(e) => setFilterTable(e.target.value)} aria-label="Table">
            <option value="all">All Tables</option>
            {tables.map((t) => <option key={t} value={t}>Table {t}</option>)}
          </select>
        )}
        <select className="input" value={filterSub} onChange={(e) => setFilterSub(e.target.value)} aria-label="Subinventory">
          <option value="all">All Locations</option>
          {SUBS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="chips" role="group" aria-label="Status filter">
        {chips.map(([f, l, n]) => (
          <button key={f} type="button" aria-pressed={filterStatus === f}
            className={`btn sm ${filterStatus === f ? `on t-${chipTone[f]}` : ""}`}
            onClick={() => setFilterStatus(f)}>
            {l}{n ? <span className={`count ${f === "overorder" ? "bad" : ""}`}>{n}</span> : null}
          </button>
        ))}
      </div>

      {edit && (
        <div className="edit-panel">
          <div className="lbl-title"><i className={`fa-solid ${edit === "new" ? "fa-plus" : "fa-pen"}`} />{edit === "new" ? "New Item" : "Edit Item"}</div>
          <div className="grid-3">
            <Field label="Part Number *">
              <input className="input mono" value={form.partCode} placeholder="SCR-IP14-001"
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  const match = parts.find((p) => p.code === code);
                  setForm((f) => ({ ...f, partCode: code, partName: match ? match.name : f.partName }));
                }} />
            </Field>
            <Field label="Part Name">
              <input className="input" value={form.partName} placeholder="Auto-filled by Part Number" onChange={(e) => setForm((f) => ({ ...f, partName: e.target.value }))} />
            </Field>
            <Field label="Subinventory">
              <select className="input" value={form.subinventory} onChange={(e) => setForm((f) => ({ ...f, subinventory: e.target.value }))}>
                {SUBS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Table No *">
              <input className="input mono" value={form.tableNo} placeholder="5A" onChange={(e) => setForm((f) => ({ ...f, tableNo: e.target.value.toUpperCase() }))} />
            </Field>
            <Field label="Employee Name *">
              <input className="input" value={form.employeeName} placeholder="JOHN" onChange={(e) => setForm((f) => ({ ...f, employeeName: e.target.value.toUpperCase() }))} />
            </Field>
            <div className="pair">
              <Field label="Qty on Table">
                <input className="input" type="number" min="0" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} />
              </Field>
              <Field label="Max">
                <input className="input" type="number" min="1" value={form.max} onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))} />
              </Field>
            </div>
          </div>
          <div className="note info-note" style={{ margin: "16px 0" }}>
            <i className="fa-solid fa-circle-info" />
            <span>The <b>Max</b> field is set by the manager — the most of this part allowed on the table.</span>
          </div>
          <div className="row">
            <button type="button" className="btn t-ok" onClick={save}><i className="fa-solid fa-check" />Save</button>
            <button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!list.length && (
        <div className="empty">
          {deskInv.length === 0
            ? <><i className="fa-solid fa-table-cells-large" />No data. Press <b>Add</b> to enter the first item.</>
            : "No results for the selected filters"}
        </div>
      )}

      {list.length > 0 && (
        <div className="tbl-wrap">
          <table className="tbl compact" style={{ minWidth: 780 }}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Part</th>
                <th className="c">Qty</th>
                <th className="c">Max</th>
                <th className="c">Ordered</th>
                <th>Table · Name</th>
                <th>Subinventory</th>
                {isAuth && <th className="r" aria-label="Actions"></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const s = SC[d.status];
                const b = d.overOrder ? SC.excess : s;
                const rowCls = d.isNew ? "is-new" : d.overOrder ? "is-over" : d.status === "red" ? "low" : d.status === "yellow" ? "is-warn" : "";
                const good = d.subinventory === SUBS[0];
                return (
                  <tr key={d.id} className={rowCls}>
                    <td>
                      <div className="cell-stack">
                        <span className={`badge t-${b.tone}`}><i className={`fa-solid ${b.icon}`} />{b.label}</span>
                        {d.isNew && <span className="badge sm t-acc"><i className="fa-solid fa-star" />New</span>}
                      </div>
                    </td>
                    <td>
                      <div className="two"><span className="code">{d.partCode}</span><small title={d.partName}>{d.partName}</small></div>
                    </td>
                    <td className="c">
                      {isAuth
                        ? <Stepper qty={d.qty} tone={s.tone} onMinus={() => adjQty(d.id, -1)} onPlus={() => adjQty(d.id, 1)} />
                        : <b className={`mono t-${s.tone}`}>{d.qty}</b>}
                    </td>
                    <td className="c mono t-muted" style={{ fontWeight: 600 }}>{d.max}</td>
                    <td className="c">
                      {d.ordered > 0 ? (
                        <div className="ordered">
                          <span className={`badge ${d.overOrder ? "t-bad" : "t-warn"}`}><b className="plus">+{d.ordered}</b>pcs</span>
                          <span className={`proj ${d.overOrder ? "t-bad" : ""}`}><i className="fa-solid fa-arrow-right" />{d.projected} / {d.max}</span>
                          {d.overOrder && <span className="badge sm t-bad"><i className="fa-solid fa-arrow-up" />+{d.excess} excess</span>}
                          {d.orderedOrders.map((o, i) => <span key={i} className="oid">{o.orderId}</span>)}
                        </div>
                      ) : <span className="dash">—</span>}
                    </td>
                    <td>
                      <div className="two"><b className="mono">#{d.tableNo}</b><small>{d.employeeName}</small></div>
                    </td>
                    <td>
                      <span className={`badge ${good ? "t-acc" : "t-warn"}`} title={d.subinventory}>
                        <i className={`fa-solid ${good ? "fa-box-archive" : "fa-recycle"}`} />{good ? "Good Part" : "Consumed"}
                      </span>
                    </td>
                    {isAuth && (
                      <td className="r">
                        <div className="actions">
                          <button type="button" className="btn icon sm" onClick={() => openEdit(d)} title="Edit" aria-label="Edit"><i className="fa-solid fa-pen" /></button>
                          <button type="button" className="btn icon sm t-bad" onClick={() => remove(d.id)} title="Delete" aria-label="Delete"><i className="fa-solid fa-trash" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
