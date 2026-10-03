import React, { useState } from "react";
import PrintModal from "../components/PrintModal.jsx";
import PasswordModal from "../components/PasswordModal.jsx";
import OrderPill from "../components/morph/OrderPill.jsx";
import DecideMorph from "../components/morph/DecideMorph.jsx";
import ExportMorph from "../components/morph/ExportMorph.jsx";
import { AccessLine, SearchBox, Stepper } from "../components/ui.jsx";
import { fmt, ST } from "../lib/utils.js";

const FILTERS = [["pending", "Pending"], ["approved", "Issued"], ["rejected", "Rejected"], ["all", "All"]];

/** Warehouse staff panel: incoming orders. */
export default function WarehouseView({ orders, setOrders, parts, setParts, setDeskInv, isAuth, onAuth, exportOrders }) {
  const [filter, setFilter] = useState("pending");
  const [openSet, setOpenSet] = useState(new Set());
  const [printOrder, setPrintOrder] = useState(null);
  const [printed, setPrinted] = useState({});
  const [search, setSearch] = useState("");
  const [showClear, setShowClear] = useState(false);

  const toggleOpen = (id) => setOpenSet((prev) => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const q = search.trim().toLowerCase();
  const list = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (!q) return true;
    return o.id.toLowerCase().includes(q) || o.employeeName.toLowerCase().includes(q) || String(o.tableNo).toLowerCase().includes(q);
  });
  const pendingN = orders.filter((o) => o.status === "pending").length;

  const upd = (id, patch) => setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const toggleItem = (order, i) => {
    if (!isAuth) { onAuth(); return; }
    upd(order.id, { items: order.items.map((it, j) => (j === i ? { ...it, removed: !it.removed } : it)) });
  };

  // −1; at 1 the item becomes "removed" with qty 0
  const decreaseItemQty = (order, i) => {
    if (!isAuth) { onAuth(); return; }
    const item = order.items[i];
    upd(order.id, {
      items: order.items.map((it, j) => (j !== i ? it : item.qty <= 1 ? { ...it, qty: 0, removed: true } : { ...it, qty: it.qty - 1 })),
    });
  };
  const increaseItemQty = (order, i) => {
    if (!isAuth) { onAuth(); return; }
    upd(order.id, { items: order.items.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x)) });
  };

  // Issue: deduct active items from stock and add them to the employee's desk
  const approve = (o, canApprove) => {
    if (!isAuth) { onAuth(); return; }
    if (!canApprove) return;
    const activeItems = o.items.filter((it) => !it.removed);
    setParts((pp) => pp.map((pt) => {
      const hit = activeItems.find((it) => it.code === pt.code);
      return hit ? { ...pt, qty: Math.max(0, pt.qty - hit.qty) } : pt;
    }));
    setDeskInv((prev) => prev.map((d) => {
      const hit = activeItems.find((it) => it.code === d.partCode && String(o.tableNo).toUpperCase() === String(d.tableNo).toUpperCase());
      return hit ? { ...d, qty: d.qty + hit.qty } : d;
    }));
    upd(o.id, { status: "approved", resolvedAt: new Date().toISOString() });
  };

  const reject = (o) => {
    if (!isAuth) { onAuth(); return; }
    upd(o.id, { status: "rejected", resolvedAt: new Date().toISOString() });
  };

  const openPrint = (o) => { setPrinted((p) => ({ ...p, [o.id]: true })); setPrintOrder(o); };

  return (
    <section className="card">
      {printOrder && <PrintModal order={printOrder} onClose={() => setPrintOrder(null)} />}
      {showClear && (
        <PasswordModal
          danger
          icon="fa-trash"
          title="Clear History"
          text={<>This deletes <b>all orders</b> with no way to recover them. Enter the warehouse password to confirm.</>}
          okLabel="Delete All"
          okIcon="fa-trash"
          onOk={() => { setOrders([]); setShowClear(false); }}
          onClose={() => setShowClear(false)}
        />
      )}

      <div className="card-head">
        <div>
          <h2 className="title"><i className="fa-solid fa-warehouse t-acc" />Incoming Orders</h2>
          <p className="sub"><AccessLine isAuth={isAuth} onAuth={onAuth} /></p>
        </div>
        <div className="row">
          <ExportMorph label="Excel" run={exportOrders} />
          {isAuth && (
            <button type="button" className="btn t-bad" onClick={() => setShowClear(true)}>
              <i className="fa-solid fa-trash" />Clear History
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by order number, name or table…" />
      </div>

      <div className="chips" role="group" aria-label="Status filter">
        {FILTERS.map(([f, l]) => (
          <button key={f} type="button" className={`btn sm ${filter === f ? "on t-acc" : ""}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {l}{f === "pending" && <span className="count">{pendingN}</span>}
          </button>
        ))}
      </div>

      {!list.length && <div className="empty"><i className="fa-solid fa-inbox" />No orders in this category</div>}

      {list.map((o) => {
        const gone = o.items.filter((it) => it.removed);
        const active = o.items.filter((it) => !it.removed);
        const wasPrinted = !!printed[o.id];
        const stockIssues = active.map((it) => {
          const p = parts.find((x) => x.code === it.code);
          if (!p) return null;
          if (p.qty === 0) return { code: it.code, have: 0, need: it.qty, type: "empty" };
          if (p.qty < it.qty) return { code: it.code, have: p.qty, need: it.qty, type: "low" };
          return null;
        }).filter(Boolean);
        const hasStockIssues = stockIssues.length > 0;
        const hasZeroQty = active.some((it) => it.qty === 0);
        const canApprove = wasPrinted && !hasStockIssues && !hasZeroQty;
        const st = ST[o.status] || { label: o.status, tone: "muted" };
        const editable = o.status === "pending" && isAuth;

        return (
          <OrderPill
            key={o.id}
            id={o.id}
            open={openSet.has(o.id)}
            onToggle={() => toggleOpen(o.id)}
            head={<>
              <span className={`opill-dot ${st.tone}`} aria-hidden="true" />
              <span className="opill-main">
                <span className="opill-id">{o.id}</span>
                <span className="opill-meta">
                  <i className="fa-solid fa-user" />{o.employeeName}
                  <span className="sep">·</span>Table <b className="mono">#{o.tableNo}</b>
                  <span className="sep">·</span><span className="mono">{fmt(o.createdAt)}</span>
                </span>
              </span>
              <span className="opill-tags">
                {gone.length > 0 && <span className="badge t-bad">−{gone.length} removed</span>}
                {hasStockIssues && o.status === "pending" && (
                  <span className="badge t-warn"><i className="fa-solid fa-triangle-exclamation" />{stockIssues.length} issues</span>
                )}
                <span className={`badge t-${st.tone}`}>{st.label}</span>
              </span>
            </>}
          >
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Part Name</th>
                    <th className="hide-sm">Location</th>
                    <th className="c">Qty</th>
                    {editable && <th className="r">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((it, i) => {
                    const sp = parts.find((x) => x.code === it.code);
                    const issue = !it.removed && sp
                      ? sp.qty === 0 ? { type: "empty", have: 0 } : sp.qty < it.qty ? { type: "low", have: sp.qty } : null
                      : null;
                    return (
                      <tr key={i} className={it.removed ? "removed" : issue ? "issue" : ""}>
                        <td>
                          <span className={`code inline-ico ${issue ? "t-bad" : ""}`}>
                            {it.removed && <i className="fa-solid fa-xmark t-bad" />}
                            {issue && <i className="fa-solid fa-triangle-exclamation" />}
                            {it.code}
                          </span>
                        </td>
                        <td className="strike">{it.name}</td>
                        <td className="loc hide-sm">{it.location}</td>
                        <td className="c">
                          <div className="cell-stack">
                            {editable && !it.removed ? (
                              <Stepper qty={it.qty} onMinus={() => decreaseItemQty(o, i)} onPlus={() => increaseItemQty(o, i)} />
                            ) : (
                              <b className="mono">{it.qty} pcs</b>
                            )}
                            {issue?.type === "empty" && <span className="badge sm t-bad"><i className="fa-solid fa-xmark" />Out of stock (stock: 0)</span>}
                            {issue?.type === "low" && <span className="badge sm t-warn"><i className="fa-solid fa-triangle-exclamation" />In stock: {issue.have} · needed: {it.qty}</span>}
                          </div>
                        </td>
                        {editable && (
                          <td className="r">
                            <button type="button" className={`btn sm ${it.removed ? "t-ok" : "t-bad"}`} onClick={() => toggleItem(o, i)}>
                              <i className={`fa-solid ${it.removed ? "fa-rotate-left" : "fa-trash"}`} />{it.removed ? "Restore" : "Remove"}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {o.status === "pending" && (
              isAuth ? (
                <div className="order-actions">
                  <button type="button" className="btn t-acc" onClick={() => openPrint(o)}><i className="fa-solid fa-print" />Print</button>
                  <DecideMorph
                    issueLabel={`To Issue${gone.length > 0 ? ` (${active.length} of ${o.items.length})` : ""}`}
                    canIssue={canApprove}
                    issueTitle={!wasPrinted ? "Print order first" : hasStockIssues ? "Insufficient parts in stock" : "Issue order"}
                    onIssue={() => approve(o, canApprove)}
                    onReject={() => reject(o)}
                  />
                  {!wasPrinted && <span className="warn-text"><i className="fa-solid fa-print" />Print order first</span>}
                  {wasPrinted && hasStockIssues && <span className="err-text"><i className="fa-solid fa-triangle-exclamation" />Fix quantity or remove items to issue</span>}
                  {gone.length > 0 && canApprove && <span className="sub" style={{ margin: 0 }}>Only {active.length} items will be deducted on issue</span>}
                </div>
              ) : (
                <div className="order-actions sub">
                  <span className="inline"><i className="fa-solid fa-lock" /><button type="button" className="link-btn" onClick={onAuth}>Login as warehouse staff</button> to manage the order</span>
                </div>
              )
            )}

            {(o.status === "approved" || o.status === "rejected") && (
              <div className="order-actions">
                <button type="button" className="btn t-acc" onClick={() => openPrint(o)}><i className="fa-solid fa-print" />Print</button>
              </div>
            )}

            {o.resolvedAt && <div className="resolved">Processed: <span className="mono">{fmt(o.resolvedAt)}</span></div>}
          </OrderPill>
        );
      })}
    </section>
  );
}
