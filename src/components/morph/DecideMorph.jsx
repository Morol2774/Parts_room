import React, { useEffect, useRef, useState } from "react";

/**
 * Morph #3 · Issue / Reject → status badge.
 * The pressed button turns into a pressed-in badge, the other one collapses;
 * the real action runs once the morph has played.
 */
export default function DecideMorph({ issueLabel, canIssue, issueTitle, onIssue, onReject }) {
  const [chosen, setChosen] = useState(null); // null | "issue" | "reject"
  const t = useRef();
  useEffect(() => () => clearTimeout(t.current), []);

  const pick = (which) => {
    if (chosen) return;
    if (which === "issue" && !canIssue) return;
    setChosen(which);
    t.current = setTimeout(() => (which === "issue" ? onIssue() : onReject()), 750);
  };

  return (
    <div className={`decide ${chosen ? "done" : ""}`} aria-live="polite">
      <button
        type="button"
        className={`btn issue ${chosen === "issue" ? "chosen" : ""}`}
        disabled={!canIssue && !chosen}
        title={issueTitle}
        onClick={() => pick("issue")}
        data-audit="issue"
      >
        <i className="fa-solid fa-circle-check" />
        {chosen === "issue" ? "Issued" : issueLabel}
      </button>
      <button
        type="button"
        className={`btn reject ${chosen === "reject" ? "chosen" : ""}`}
        onClick={() => pick("reject")}
        data-audit="reject"
      >
        <i className={`fa-solid ${chosen === "reject" ? "fa-circle-xmark" : "fa-xmark"}`} />
        {chosen === "reject" ? "Rejected" : "Reject"}
      </button>
    </div>
  );
}
