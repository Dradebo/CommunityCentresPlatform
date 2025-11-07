import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          // Base styles with explicit colors
          "flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base md:text-sm",
          "bg-white dark:bg-gray-800",
          "border-gray-300 dark:border-gray-600",
          "text-gray-900 dark:text-gray-100",
          // Placeholder styles
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          // Selection styles
          "selection:bg-primary-500 selection:text-white",
          // Focus styles
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500",
          // Invalid/error styles
          "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-200 dark:aria-invalid:ring-red-900",
          // Disabled styles
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900",
          // File input styles
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-700 dark:file:text-gray-300",
          // Transitions
          "transition-colors duration-200",
          className,
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
