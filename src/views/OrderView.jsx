import React, { useState } from "react";
import PartInput from "../components/PartInput.jsx";
import AddStepper from "../components/morph/AddStepper.jsx";
import SubmitMorph from "../components/morph/SubmitMorph.jsx";
import { Field } from "../components/ui.jsx";
import { genId } from "../lib/utils.js";

const blankItem = () => ({ code: "", qty: 1 });

/** Employee screen: build an order and send it to the warehouse. */
export default function OrderView({ parts, onSubmit, notify }) {
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [items, setItems] = useState([blankItem()]);
  const [err, setErr] = useState({});
  const [dupPair, setDupPair] = useState(null); // {newIdx, existIdx}
  const [formKey, setFormKey] = useState(0); // bump → re-creates PartInput

  const setItem = (i, f, v) => setItems((p) => p.map((it, j) => (j === i ? { ...it, [f]: v } : it)));

  // name: letters/spaces, upper case, max 10
  const onNameChange = (e) => setName(e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, "").toUpperCase().slice(0, 10));
  // table: letters + digits, upper case, max 10
  const onTableChange = (e) => setTable(e.target.value.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, "").toUpperCase().slice(0, 10));

  const onCodeChange = (i, v) => {
    const code = v.trim().toUpperCase();
    const dupI = items.findIndex((it, j) => j !== i && it.code.trim().toUpperCase() === code && code !== "");
    setDupPair(dupI !== -1 ? { newIdx: i, existIdx: dupI } : null);
    setItem(i, "code", v);
  };

  // empty string is allowed while typing / when the stepper collapses to "Add"
  const onQtyChange = (i, raw) => {
    if (raw === "") { setItem(i, "qty", ""); return; }
    setItem(i, "qty", Math.max(0, parseInt(raw, 10) || 0));
  };

  const removeOrClear = (i) => {
    if (items.length === 1) {
      setItems([blankItem()]);
      setFormKey((k) => k + 1);
    } else {
      setItems((p) => p.filter((_, j) => j !== i));
    }
    setDupPair(null);
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = true;
    if (!table.trim()) e.table = true;
    items.forEach((it, i) => {
      const code = it.code.trim().toUpperCase();
      if (!code) { e[`c${i}`] = true; return; }
      const part = parts.find((p) => p.code === code);
      if (part && part.qty === 0) { e[`outofstock${i}`] = true; e[`q${i}`] = true; }
      else if (it.qty === "" || Number(it.qty) < 1) { e[`q${i}`] = true; e[`qempty${i}`] = true; }
      else if (part && Number(it.qty) > part.qty) { e[`qover${i}`] = true; e[`q${i}`] = true; }
    });
    setErr(e);
    return !Object.keys(e).length;
  };

  const hasEmptyQty = items.some((it) => it.qty === "");

  // step 1 (click): checks only — the button shakes if this returns false
  const check = () => {
    if (hasEmptyQty) { notify("Specify valid quantity for all items", false); return false; }
    return validate();
  };

  // step 2 (after the spinner): build and send the order, reset the form
  const send = () => {
    const enriched = items.map((it) => {
      const code = it.code.trim().toUpperCase();
      const p = parts.find((x) => x.code === code);
      return { code, qty: Number(it.qty), name: p?.name || "—", location: p?.location || "—", removed: false };
    });
    onSubmit({
      id: genId(),
      employeeName: name.trim(),
      tableNo: table.trim(),
      items: enriched,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    setName(""); setTable(""); setItems([blankItem()]); setErr({}); setDupPair(null); setFormKey((k) => k + 1);
  };

  return (
    <section className="card">
      <div className="card-head" style={{ marginBottom: 22 }}>
        <div>
          <h2 className="title"><i className="fa-solid fa-clipboard-list t-acc" />New Parts Order</h2>
          <p className="sub">Enter a Part Number or start typing the name — suggestions appear. Use ↑ ↓ to move, Enter to pick.</p>
        </div>
      </div>

      <div className="grid-2">
        <Field label="Employee Name" error={err.name}>
          <input className={`input ${err.name ? "is-err" : ""}`} value={name} onChange={onNameChange} placeholder="Enter Name" maxLength={10} />
        </Field>
        <Field label="Table Number" error={err.table}>
          <input className={`input mono ${err.table ? "is-err" : ""}`} value={table} onChange={onTableChange} placeholder="5A" maxLength={10} />
        </Field>
      </div>

      <div className="lbl sec-label">Parts for Order</div>

      {items.map((it, i) => {
        const code = it.code.trim().toUpperCase();
        const part = parts.find((p) => p.code === code);
        const isDup = dupPair && (dupPair.newIdx === i || dupPair.existIdx === i);
        const isOut = part && part.qty === 0;
        const isOver = part && it.qty !== "" && Number(it.qty) > part.qty;
        const qErr = err[`q${i}`] || isOver || isOut;
        return (
          <div key={i} className={`item-row ${isDup ? "dup" : ""}`}>
            {isDup && (
              <div className="dup-alert"><i className="fa-solid fa-triangle-exclamation" />This part is already in the order — check the rows above / below</div>
            )}
            <div className="item-grid">
              <div className="field part">
                <span className="lbl">Part Number #{i + 1} *</span>
                <PartInput key={`${formKey}-${i}`} value={it.code} onChange={(v) => onCodeChange(i, v)} parts={parts} error={err[`c${i}`]} />
                {isOut && <span className="err-text"><i className="fa-solid fa-xmark" />Out of stock (stock: 0)</span>}
              </div>

              <div className="ctrl">
                <AddStepper
                  qty={it.qty === "" ? "" : String(it.qty)}
                  max={part && part.qty > 0 ? part.qty : undefined}
                  error={!!qErr}
                  onChange={(v) => onQtyChange(i, v)}
                />
                {isOver && <span className="err-text">In stock: {part.qty} pcs</span>}
                {err[`qempty${i}`] && <span className="err-text">Specify quantity</span>}
              </div>

              <div className="ctrl del">
                <button type="button" className="btn icon" onClick={() => removeOrClear(i)}
                  title={items.length === 1 ? "Clear fields" : "Delete row"} aria-label={items.length === 1 ? "Clear fields" : "Delete row"}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <button type="button" className="add-row" onClick={() => setItems((p) => [...p, blankItem()])}>
        <i className="fa-solid fa-plus" />Add another part
      </button>

      <div className="submit-bar">
        {hasEmptyQty && <span className="warn-text"><i className="fa-solid fa-triangle-exclamation" />Specify valid quantity</span>}
        <SubmitMorph onClick={check} onDone={send} dim={hasEmptyQty}>
          <i className="fa-solid fa-print" />Submit and Print Order
        </SubmitMorph>
      </div>
    </section>
  );
}
