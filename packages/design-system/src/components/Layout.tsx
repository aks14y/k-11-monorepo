import * as React from "react";
import { Stack as MantineStack, StackProps as MantineStackProps, Paper } from "@mantine/core";
import styles from "./Layout.module.css";

interface StackProps extends Omit<MantineStackProps, "gap"> {
  gap?: string;
  direction?: "row" | "column";
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap, direction = "column", className, ...props }, ref) => {
    // Convert gap string to number if it's a number string
    const gapValue = gap && /^\d+$/.test(gap) ? parseInt(gap, 10) : gap || "md";
    
    const combinedClassName = direction === "row" 
      ? `${styles.stackRow} ${className || ""}`.trim()
      : className;
    
    return (
      <MantineStack
        ref={ref}
        gap={gapValue}
        className={combinedClassName}
        {...props}
      />
    );
  }
);
Stack.displayName = "Stack";

interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

const PageSection = React.forwardRef<HTMLDivElement, PageSectionProps>(
  ({ className, children, ...props }, ref) => (
    <Paper ref={ref} p="md" radius="md" withBorder className={className} {...props}>
      {children}
    </Paper>
  )
);
PageSection.displayName = "PageSection";

export { Stack, PageSection };
