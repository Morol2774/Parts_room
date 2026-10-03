import React from "react";

/**
 * Morph #6 · collapsed order pill → expanded card.
 * Height animates through grid-template-rows 0fr → 1fr (no JS measuring).
 */
export default function OrderPill({ open, onToggle, head, children, id }) {
  return (
    <article className={`opill ${open ? "open" : ""}`} data-audit="opill">
      <button type="button" className="opill-head" aria-expanded={open} aria-controls={`ob-${id}`} onClick={onToggle}>
        {head}
        <span className="chev" aria-hidden="true"><i className="fa-solid fa-chevron-down" /></span>
      </button>
      <div className="opill-body" id={`ob-${id}`}>
        <div className="inner">
          <div className="pad" inert={open ? undefined : ""}>{children}</div>
        </div>
      </div>
    </article>
  );
}
