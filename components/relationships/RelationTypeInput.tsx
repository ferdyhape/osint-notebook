"use client";

import { useId } from "react";
import { RELATIONSHIP_VOCAB } from "@/lib/relationship";

/**
 * A relation-type text field with a live preview sentence underneath, so
 * typing "found" while looking at "Salsabila Putri Ikhsani (name) … birthday
 * date" immediately shows "Salsabila Putri Ikhsani (name) found birthday
 * date" — the direction and the wording are both checkable before saving,
 * which is what the bare, hint-less input never gave you.
 */
export function RelationTypeInput({
  value,
  onChange,
  fromText,
  toText,
  autoFocus,
  onKeyDown,
}: {
  value: string;
  onChange: (value: string) => void;
  /** The source side of the sentence — usually the entity this is being added from. */
  fromText: string;
  /** The target side — usually the type currently selected for the other entity. */
  toText: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const listId = useId();

  return (
    <div>
      <input
        list={listId}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="field"
        placeholder="found, mentions, links to…"
        autoComplete="off"
      />
      <datalist id={listId}>
        {RELATIONSHIP_VOCAB.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <p className="text-xs text-muted mt-1.5 break-words">
        <span className="font-medium text-text">{fromText}</span>{" "}
        <span className={value.trim() ? "text-accent" : "italic"}>{value.trim() || "…"}</span>{" "}
        <span className="font-medium text-text">{toText}</span>
      </p>
    </div>
  );
}
