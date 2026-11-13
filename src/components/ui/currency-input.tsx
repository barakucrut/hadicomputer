"use client";

import { useLayoutEffect, useRef } from "react";

type CurrencyInputProps = {
  id: string;
  name: string;
  value: string;
  placeholder?: string;
  className?: string;
  onValueChange: (value: string) => void;
};

// Keep the submitted value unformatted; separators are presentation only.
export function CurrencyInput({
  id,
  name,
  value,
  placeholder,
  className = "",
  onValueChange,
}: CurrencyInputProps) {
  const input = useRef<HTMLInputElement>(null);
  const caretDigits = useRef<number | null>(null);
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  useLayoutEffect(() => {
    if (caretDigits.current === null || !input.current) return;
    let position = 0;
    let count = 0;
    while (position < formatted.length && count < caretDigits.current) {
      if (/\d/.test(formatted[position])) count++;
      position++;
    }
    input.current.setSelectionRange(position, position);
    caretDigits.current = null;
  });

  return (
    <div className={`currency-input ${className}`.trim()}>
      <span aria-hidden="true" className="currency-prefix">
        Rp
      </span>
      <input
        ref={input}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={formatted}
        className="currency-field"
        onChange={(event) => {
          const text = event.target.value;
          caretDigits.current = text
            .slice(0, event.target.selectionStart ?? text.length)
            .replace(/\D/g, "").length;
          onValueChange(text.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
        }}
      />
      <input type="hidden" name={name} value={digits} />
    </div>
  );
}
