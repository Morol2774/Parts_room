import React, { useRef } from "react";

/**
 * Morph #2 · "Add" pill → − n + stepper.
 * qty === "" (or 0) shows the collapsed "Add" pill; pressing it sets 1.
 * − at 1 collapses back to "Add". The number itself stays typeable.
 */
export default function AddStepper({ qty, onChange, error = false, max }) {
  const open = qty !== "" && Number(qty) > 0;
  const valRef = useRef(null);

  const bump = () => {
    const el = valRef.current;
    if (!el) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  };
  const step = (d) => {
    const n = (Number(qty) || 0) + d;
    if (n <= 0) { onChange(""); return; }
    onChange(String(n));
    bump();
  };

  return (
    <div
      className={`btn morph adder ${open ? "open" : ""} ${error ? "is-err" : ""}`}
      role={open ? "group" : "button"}
      tabIndex={open ? -1 : 0}
      aria-label={open ? "Quantity" : "Add quantity"}
      onClick={() => { if (!open) onChange("1"); }}
      onKeyDown={(e) => { if (!open && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onChange("1"); } }}
      data-audit="adder"
    >
      <span className="layer l-idle"><i className="fa-solid fa-plus" />Add</span>
      <span className="layer l-step">
        <button type="button" className="qbtn" tabIndex={open ? 0 : -1} aria-label="Decrease" onClick={() => step(-1)}>
          <i className="fa-solid fa-minus" />
        </button>
        <input
          ref={valRef}
          className="qinput qval"
          inputMode="numeric"
          tabIndex={open ? 0 : -1}
          aria-label="Quantity"
          value={qty}
          max={max}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
          onAnimationEnd={(e) => e.currentTarget.classList.remove("bump")}
        />
        <button type="button" className="qbtn plus" tabIndex={open ? 0 : -1} aria-label="Increase" onClick={() => step(1)}>
          <i className="fa-solid fa-plus" />
        </button>
      </span>
    </div>
  );
}
