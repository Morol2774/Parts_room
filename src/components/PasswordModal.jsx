import React, { useState } from "react";
import { PASS } from "../config.js";

/**
 * Password prompt in a modal. Used for staff login on narrow screens
 * and for confirming "Clear History".
 */
export default function PasswordModal({ title, icon = "fa-lock", text, okLabel, okIcon, danger = false, onOk, onClose }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const go = () => {
    if (pw === PASS) { onOk(); }
    else { setErr(true); setPw(""); setTimeout(() => setErr(false), 1500); }
  };
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal ${err ? "shake" : ""}`}>
        <h3 className={danger ? "t-bad" : ""}><i className={`fa-solid ${icon}`} />{title}</h3>
        <p>{text}</p>
        <input
          className={`input ${err ? "is-err" : ""}`}
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") go(); if (e.key === "Escape") onClose(); }}
          placeholder="Password"
          autoFocus
        />
        {err && <div className="err-text" style={{ marginTop: 8 }}><i className="fa-solid fa-xmark" />Invalid password</div>}
        <div className="actions">
          <button type="button" className={`btn ${danger ? "t-bad" : "primary"}`} onClick={go}>
            {okIcon && <i className={`fa-solid ${okIcon}`} />}{okLabel}
          </button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
