"use client";
import * as React from "react";

export interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

export function DualRangeSlider({
  min,
  max,
  step = 500000,
  value,
  onChange,
  className = "",
}: DualRangeSliderProps) {
  const [minValue, maxValue] = value;
  const minPercent = Math.max(
    0,
    Math.min(100, ((minValue - min) / (max - min)) * 100),
  );
  const maxPercent = Math.max(
    0,
    Math.min(100, ((maxValue - min) / (max - min)) * 100),
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxValue - step);
    onChange([val, maxValue]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minValue + step);
    onChange([minValue, val]);
  };

  return (
    <div className={`shadcn-slider-root ${className}`.trim()}>
      <div className="shadcn-slider-track">
        <div
          className="shadcn-slider-range"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />
      </div>
      {/* Visual toggle slider thumbs */}
      <span
        className="shadcn-slider-thumb"
        style={{ left: `${minPercent}%` }}
        aria-hidden="true"
      />
      <span
        className="shadcn-slider-thumb"
        style={{ left: `${maxPercent}%` }}
        aria-hidden="true"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minValue}
        onChange={handleMinChange}
        className="shadcn-slider-input input-min"
        aria-label="Slider harga minimum"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxValue}
        onChange={handleMaxChange}
        className="shadcn-slider-input input-max"
        aria-label="Slider harga maksimum"
      />
    </div>
  );
}
