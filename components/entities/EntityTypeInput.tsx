"use client";

import { useEffect, useId, useState } from "react";
import { ANY_ENTITY_TYPE, ENTITY_TYPES } from "@/lib/pivot";

type EntityTypeInputProps = {
  value: string;
  onChange: (value: string) => void;
  includeAny?: boolean;
};

export function EntityTypeInput({ value, onChange, includeAny = false }: EntityTypeInputProps) {
  const listId = useId();
  const [types, setTypes] = useState<string[]>([...ENTITY_TYPES]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/entity-types")
      .then((res) => res.json())
      .then((data: string[]) => {
        if (!cancelled && Array.isArray(data)) setTypes(data);
      })
      .catch(() => {
        /* keep the built-in list as fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = includeAny ? [ANY_ENTITY_TYPE, ...types] : types;

  return (
    <>
      <input
        required
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field"
        placeholder="pick one or type your own"
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </>
  );
}
