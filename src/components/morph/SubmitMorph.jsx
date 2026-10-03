import React, { useEffect, useRef, useState } from "react";

/**
 * Morph #1 · Submit → spinner → check.
 * onClick() must return true when the action is accepted (validation passed).
 * The real work runs in onDone() after the spinner, so it can't be double-sent.
 */
export default function SubmitMorph({ children, onClick, onDone, dim = false }) {
  const [st, setSt] = useState("idle"); // idle | loading | ok
  const [shake, setShake] = useState(false);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const click = () => {
    if (st !== "idle") return;
    if (!onClick()) {
      setShake(false);
      requestAnimationFrame(() => setShake(true));
      return;
    }
    setSt("loading");
    later(() => { onDone?.(); setSt("ok"); }, 650);
    later(() => setSt("idle"), 2100);
  };

  const label = st === "loading" ? "Sending order…" : st === "ok" ? "Order sent" : undefined;
  return (
    <button
      type="button"
      className={`btn morph submit ${st === "idle" ? "" : st} ${dim && st === "idle" ? "dim" : ""} ${shake ? "shake" : ""}`}
      onClick={click}
      onAnimationEnd={() => setShake(false)}
      aria-label={label}
      aria-live="polite"
      data-audit="submit"
    >
      <span className="layer l-idle">{children}</span>
      <span className="layer l-spin" aria-hidden="true"><i className="spinner" /></span>
      <span className="layer l-done" aria-hidden="true"><i className="fa-solid fa-check" /></span>
    </button>
  );
}
