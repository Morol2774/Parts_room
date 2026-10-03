const pad = (n, l = 2) => String(n).padStart(l, "0");

export function genId() {
  const d = new Date();
  return `ORD-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}-${pad(Math.floor(Math.random() * 999), 3)}`;
}

export function fmt(iso) {
  return new Date(iso).toLocaleString("en-En", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export const today = () => new Date().toISOString().slice(0, 10);

/** Stock level → semantic tone used for numbers (same thresholds as before). */
export const stockTone = (qty) => (qty <= 5 ? "bad" : qty <= 15 ? "warn" : "ok");

/** Order statuses. `tone` maps to CSS classes (t-warn / t-ok / t-bad). */
export const ST = {
  pending: { label: "Pending", tone: "warn" },
  approved: { label: "Issued", tone: "ok" },
  rejected: { label: "Rejected", tone: "bad" },
};
