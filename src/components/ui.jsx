import React from "react";

/** Labelled form field. */
export function Field({ label, error, children }) {
  return (
    <div className="field">
      <label className="lbl">{label}</label>
      {children}
      {error && <span className="err-text">Required field</span>}
    </div>
  );
}

/** Always-open soft stepper (− n +) for stock tables. */
export function Stepper({ qty, tone, onMinus, onPlus }) {
  return (
    <div className="stepper" data-audit="stepper">
      <button type="button" className="qbtn" onClick={onMinus} aria-label="Decrease"><i className="fa-solid fa-minus" /></button>
      <span className={`qval ${tone ? `t-${tone}` : ""}`}>{qty}</span>
      <button type="button" className="qbtn plus" onClick={onPlus} aria-label="Increase"><i className="fa-solid fa-plus" /></button>
    </div>
  );
}

/** Search input with leading icon and clear button. */
export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="input-wrap">
      <i className="fa-solid fa-magnifying-glass lead" aria-hidden="true" />
      <input className="input has-lead" style={{ paddingRight: 40 }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label="Search" />
      {value && (
        <button type="button" className="trail" onClick={() => onChange("")} aria-label="Clear search">
          <i className="fa-solid fa-xmark" />
        </button>
      )}
    </div>
  );
}

/** Small KPI tile. */
export function Stat({ value, label, tone }) {
  return (
    <div className="stat" data-audit="stat">
      <b className={tone ? `t-${tone}` : ""}>{value}</b>
      <span>{label}</span>
    </div>
  );
}

/** Line under a card title showing whether the user can edit. */
export function AccessLine({ isAuth, onAuth, loginText = "Login as warehouse staff" }) {
  return isAuth ? (
    <span className="inline t-ok" style={{ fontWeight: 700 }}><i className="fa-solid fa-lock-open" />Warehouse mode — full access</span>
  ) : (
    <span className="inline">View only ·
      <button type="button" className="link-btn" onClick={onAuth}><i className="fa-solid fa-lock" />{loginText}</button>
    </span>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.ok ? "ok" : "err"}`} role="status">
      <i className={`fa-solid ${toast.ok ? "fa-circle-check" : "fa-circle-exclamation"}`} />{toast.msg}
    </div>
  );
}
