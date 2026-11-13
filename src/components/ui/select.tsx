import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", wrapperClassName = "", children, ...props }, ref) => {
    return (
      <div className={`shadcn-select-wrapper ${wrapperClassName}`.trim()}>
        <select
          className={`shadcn-select ${className}`.trim()}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <span className="shadcn-select-icon" aria-hidden="true">
          <ChevronDown size={16} />
        </span>
      </div>
    );
  },
);
Select.displayName = "Select";
