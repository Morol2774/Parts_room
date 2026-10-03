import React from "react";
import { fmt } from "../lib/utils.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Print preview. The printed sheet opens in its own window with plain print styles. */
export default function PrintModal({ order, onClose }) {
  const confirmed = order.status === "approved";
  const active = order.items.filter((it) => !it.removed);
  const gone = order.items.filter((it) => it.removed);
  const statusStyle = {
    background: confirmed ? "#d1fae5" : "#fef3c7",
    border: `1px solid ${confirmed ? "#6ee7b7" : "#fde68a"}`,
  };

  const doPrint = () => {
    const win = window.open("", "_blank", "width=620,height=720");
    if (!win) { alert("Allow pop-ups in your browser for printing"); return; }
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"/>
      <title>Order ${esc(order.id)}</title>
      <style>
        body{font-family:'Courier New',monospace;padding:30px;color:#111;font-size:13px;margin:0}
        h2{font-size:16px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:14px}
        .info{line-height:2.2;margin-bottom:14px;font-size:13px}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        th{border:1px solid #333;padding:7px 10px;background:#eee;text-align:left;font-size:12px}
        td{border:1px solid #999;padding:7px 10px;font-size:12px}
        .status{display:inline-block;padding:3px 12px;border-radius:4px;font-weight:bold;
                background:${confirmed ? "#d1fae5" : "#fef3c7"};border:1px solid ${confirmed ? "#6ee7b7" : "#fde68a"}}
        .removed{font-size:11px;color:#999;border-top:1px dashed #ccc;padding:5px 10px}
        .footer{margin-top:18px;font-size:11px;color:#777;border-top:1px dashed #bbb;padding-top:10px}
        @media print{body{padding:15px}}
      </style>
    </head><body>
      <h2>PartsRoom Warehouse · ${confirmed ? "PARTS ISSUANCE" : "PARTS REQUEST"}</h2>
      <div class="info">
        <b>Order Number:</b> ${esc(order.id)}<br/>
        <b>Employee:</b> ${esc(order.employeeName)}<br/>
        <b>Table No:</b> ${esc(order.tableNo)}<br/>
        <b>Created:</b> ${fmt(order.createdAt)}<br/>
        <b>Status:</b> <span class="status">${confirmed ? "ISSUED" : "PENDING ISSUE"}</span>
      </div>
      <table>
        <thead><tr><th>Part Number</th><th>Part Name</th><th>Location</th><th>Quantity</th></tr></thead>
        <tbody>
          ${active.map((it) => `<tr>
            <td><b>${esc(it.code)}</b></td>
            <td>${esc(it.name)}</td>
            <td><b>${esc(it.location)}</b></td>
            <td><b>${it.qty} pcs</b></td>
          </tr>`).join("")}
          ${gone.length ? `<tr><td colspan="4" class="removed">
            Removed from order: ${gone.map((i) => esc(i.code)).join(", ")}
          </td></tr>` : ""}
        </tbody>
      </table>
      <div class="footer">
        PartsRoom Warehouse System &nbsp;·&nbsp;
        Printed: ${new Date().toLocaleString("en-US")}
      </div>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1200)}<\/script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Print preview">
      <div className="modal print-modal">
        <div className="ph">
          <h3 className="t-acc"><i className="fa-solid fa-print" />Print Preview</h3>
          <button type="button" className="btn icon sm" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
        </div>

        <div className="paper">
          <div className="p-title">PartsRoom · {confirmed ? "PARTS ISSUANCE" : "PARTS REQUEST"}</div>
          <div className="p-info">
            <b>Order Number:</b> {order.id}<br />
            <b>Employee:</b> {order.employeeName}<br />
            <b>Table No:</b> {order.tableNo}<br />
            <b>Created:</b> {fmt(order.createdAt)}<br />
            <b>Status:</b> <span className="p-status" style={statusStyle}>{confirmed ? "ISSUED" : "PENDING ISSUE"}</span>
          </div>
          <table>
            <thead>
              <tr>{["Part Number", "Part Name", "Location", "Quantity"].map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {active.map((it, i) => (
                <tr key={i}>
                  <td><b>{it.code}</b></td>
                  <td>{it.name}</td>
                  <td><b>{it.location}</b></td>
                  <td><b>{it.qty} pcs</b></td>
                </tr>
              ))}
              {gone.length > 0 && (
                <tr><td colSpan={4} style={{ fontSize: 11, color: "#999", borderTop: "1px dashed #ccc" }}>
                  Removed: {gone.map((i) => i.code).join(", ")}
                </td></tr>
              )}
            </tbody>
          </table>
          <div className="p-foot">PartsRoom Warehouse &nbsp;·&nbsp; {new Date().toLocaleString("en-US")}</div>
        </div>

        <div className="pf">
          <button type="button" className="btn" onClick={onClose}>Close</button>
          <button type="button" className="btn primary" onClick={doPrint}><i className="fa-solid fa-print" />Send to Printer</button>
        </div>
      </div>
    </div>
  );
}
