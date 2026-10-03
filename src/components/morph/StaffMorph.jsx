import React, { useEffect, useRef, useState } from "react";
import { PASS } from "../../config.js";

/**
 * Morph #4 · "Staff" button → inline password field in the header.
 * Controlled: `open` comes from App so any "Login" link can open it.
 */
export default function StaffMorph({ isAuth, open, setOpen, onLogin, onLogout }) {
  const [pw, setPw] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    // click anywhere else folds the field back into the button
    const away = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) { setPw(""); setOpen(false); } };
    document.addEventListener("mousedown", away);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", away); };
  }, [open]);

  const tryPw = () => {
    if (pw === PASS) { setPw(""); setOpen(false); onLogin(); return; }
    setPw("");
    setShake(false);
    requestAnimationFrame(() => setShake(true));
    inputRef.current?.focus();
  };

  const clickBox = (e) => {
    if (e.target.closest(".l-pw")) return;
    if (isAuth) { onLogout(); return; }
    if (!open) setOpen(true);
  };

  return (
    <div
      ref={boxRef}
      className={`btn morph lockbox ${open ? "open" : ""} ${isAuth ? "in" : ""} ${shake ? "shake" : ""}`}
      role="button"
      tabIndex={open ? -1 : 0}
      aria-expanded={open}
      title={isAuth ? "Log out of warehouse mode" : "Warehouse staff login"}
      onClick={clickBox}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); clickBox(e); } }}
      onAnimationEnd={() => setShake(false)}
      data-audit="staff"
    >
      <span className="layer l-idle">
        <i className={`fa-solid ${isAuth ? "fa-lock-open" : "fa-lock"}`} />
        {isAuth ? "Logout" : "Warehouse Staff"}
      </span>
      <span className="layer l-pw">
        <input
          ref={inputRef}
          type="password"
          placeholder="Password"
          aria-label="Warehouse password"
          tabIndex={open ? 0 : -1}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") tryPw();
            if (e.key === "Escape") { setPw(""); setOpen(false); }
          }}
        />
        <button type="button" className="qbtn" tabIndex={open ? 0 : -1} aria-label="Log in" onClick={tryPw}>
          <i className="fa-solid fa-arrow-right" />
        </button>
      </span>
    </div>
  );
}
