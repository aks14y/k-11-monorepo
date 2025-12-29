import * as React from "react";
import { Button as MantineButton, ButtonProps as MantineButtonProps } from "@mantine/core";

export interface ButtonProps extends Omit<MantineButtonProps, "variant">, React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", ...props }, ref) => {
    let mantineVariant: MantineButtonProps["variant"] = "filled";
    let color: MantineButtonProps["color"] = "blue";

    if (variant === "secondary") {
      color = "green";
    } else if (variant === "ghost") {
      mantineVariant = "outline";
    }

    return (
      <MantineButton
        ref={ref}
        variant={mantineVariant}
        color={color}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
