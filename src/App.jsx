import React, { useEffect, useState } from "react";
import { STORAGE_KEYS } from "./config.js";
import { DEMO_PARTS } from "./data/demo.js";
import { LS } from "./lib/storage.js";
import { fmt, ST, today } from "./lib/utils.js";
import { readFirstSheet, writeSheet } from "./lib/excel.js";
import StaffMorph from "./components/morph/StaffMorph.jsx";
import PasswordModal from "./components/PasswordModal.jsx";
import { Toast } from "./components/ui.jsx";
import OrderView from "./views/OrderView.jsx";
import WarehouseView from "./views/WarehouseView.jsx";
import InventoryView from "./views/InventoryView.jsx";
import DeskInventoryView from "./views/DeskInventoryView.jsx";

const TABS = [
  ["order", "fa-clipboard-list", "Order"],
  ["warehouse", "fa-warehouse", "Warehouse"],
  ["inventory", "fa-boxes-stacked", "Inventory"],
];

// below this width the header has no room for the inline password field
const NARROW = "(max-width: 640px)";
const useNarrow = () => {
  const [n, setN] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const h = () => setN(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return n;
};

export default function App() {
  const [tab, setTab] = useState("order");
  const [parts, setParts] = useState(() => LS.get(STORAGE_KEYS.parts, DEMO_PARTS));
  const [orders, setOrders] = useState(() => LS.get(STORAGE_KEYS.orders, []));
  const [deskInv, setDeskInv] = useState(() => LS.get(STORAGE_KEYS.deskInv, []));
  const [isAuth, setIsAuth] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false); // inline field in header
  const [showLogin, setShowLogin] = useState(false); // modal (narrow screens)
  const [toast, setToast] = useState(null);
  const narrow = useNarrow();

  useEffect(() => LS.set(STORAGE_KEYS.parts, parts), [parts]);
  useEffect(() => LS.set(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => LS.set(STORAGE_KEYS.deskInv, deskInv), [deskInv]);

  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };
  const addOrder = (o) => setOrders((p) => [o, ...p]);
  const pendingN = orders.filter((o) => o.status === "pending").length;

  const onAuth = () => {
    if (narrow) { setShowLogin(true); return; }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStaffOpen(true);
  };
  const login = () => { setIsAuth(true); setShowLogin(false); setStaffOpen(false); notify("Logged in as warehouse staff"); };
  const logout = () => { setIsAuth(false); if (tab === "desk-inventory") setTab("order"); notify("Logged out of warehouse mode"); };

  // desks where stock (now or after pending orders) goes above Max
  const deskOverOrderCount = deskInv.reduce((count, d) => {
    let ordered = 0;
    orders
      .filter((o) => o.status === "pending" &&
        String(o.tableNo).toUpperCase() === String(d.tableNo).toUpperCase() &&
        o.employeeName.toUpperCase() === String(d.employeeName).toUpperCase())
      .forEach((o) => o.items
        .filter((it) => !it.removed && it.code === String(d.partCode).toUpperCase())
        .forEach((it) => { ordered += it.qty; }));
    return count + (d.qty > d.max || (ordered > 0 && d.qty + ordered > d.max) ? 1 : 0);
  }, 0);

  // ── Excel. Each export returns the short label shown on its button. ──
  const safely = (fn, label) => {
    try { fn(); return label; } catch (e) { notify(e.message, false); return null; }
  };

  const exportOrders = () => safely(() => {
    const rows = [];
    orders.forEach((o) => o.items.forEach((it) => rows.push({
      "Order ID": o.id,
      Date: fmt(o.createdAt),
      Employee: o.employeeName,
      "Table No": o.tableNo,
      "Part Number": it.code,
      "Part Name": it.name,
      Location: it.location,
      Qty: it.qty,
      Removed: it.removed ? "Yes" : "No",
      Status: ST[o.status]?.label || o.status,
      Processed: o.resolvedAt ? fmt(o.resolvedAt) : "",
    })));
    writeSheet(rows, [20, 16, 18, 8, 18, 24, 10, 8, 8, 12, 16], "Orders", `orders_${today()}.xlsx`);
  }, "orders.xlsx");

  const exportParts = () => safely(() => {
    writeSheet(
      parts.map((p) => ({ PartNumber: p.code, PartName: p.name, Location: p.location, Stock: p.qty })),
      [22, 30, 12, 10], "Inventory", `inventory_${today()}.xlsx`,
    );
  }, "inventory.xlsx");

  const importParts = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    readFirstSheet(file).then((rows) => {
      const mapped = rows.map((r) => ({
        code: String(r.PartNumber || r.code || "").trim(),
        name: String(r.PartName || r.name || "").trim(),
        location: String(r.Location || r.location || "").trim(),
        qty: Number(r.Stock || r.qty || 0),
      })).filter((r) => r.code);
      if (!mapped.length) { notify("No rows found in file", false); return; }
      setParts(mapped);
      notify(`Loaded ${mapped.length} items`);
    }).catch(() => notify("File read error", false));
    e.target.value = "";
  };

  const tabs = isAuth ? [...TABS, ["desk-inventory", "fa-table-cells-large", "By Table"]] : TABS;

  return (
    <>
      <Toast toast={toast} />
      {showLogin && (
        <PasswordModal
          title="Warehouse Staff Login"
          text="Enter the password to manage orders and inventory"
          okLabel="Login"
          okIcon="fa-arrow-right-to-bracket"
          onOk={login}
          onClose={() => setShowLogin(false)}
        />
      )}

      <header className="topbar">
        <div className="topbar-in">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true"><i className="fa-solid fa-screwdriver-wrench" /></span>
            <span className="brand-name">PartsRoom<small>Warehouse</small></span>
          </div>

          <nav className="seg" aria-label="Sections">
            {tabs.map(([id, ico, lbl]) => (
              <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
                <i className={`fa-solid ${ico}`} />{lbl}
                {id === "warehouse" && pendingN > 0 && <span className="count">{pendingN}</span>}
                {id === "desk-inventory" && deskOverOrderCount > 0 && <span className="count bad">{deskOverOrderCount}</span>}
              </button>
            ))}
          </nav>

          <span className="spacer" />
          <div className="staff-slot">
            <StaffMorph
              isAuth={isAuth}
              open={staffOpen && !isAuth}
              setOpen={(v) => (v && narrow ? setShowLogin(true) : setStaffOpen(v))}
              onLogin={login}
              onLogout={logout}
            />
          </div>
        </div>
      </header>

      <main className="page">
        {tab === "order" && <OrderView parts={parts} onSubmit={addOrder} notify={notify} />}
        {tab === "warehouse" && (
          <WarehouseView
            orders={orders} setOrders={setOrders}
            parts={parts} setParts={setParts}
            setDeskInv={setDeskInv}
            isAuth={isAuth} onAuth={onAuth}
            exportOrders={exportOrders}
          />
        )}
        {tab === "inventory" && (
          <InventoryView
            parts={parts} setParts={setParts}
            isAuth={isAuth} onAuth={onAuth}
            exportParts={exportParts} importParts={importParts}
          />
        )}
        {tab === "desk-inventory" && isAuth && (
          <DeskInventoryView
            deskInv={deskInv} setDeskInv={setDeskInv}
            orders={orders} parts={parts}
            isAuth={isAuth} onAuth={onAuth}
            notify={notify}
          />
        )}
      </main>
    </>
  );
}
