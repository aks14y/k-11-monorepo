import * as React from "react";
import { Title, Text as MantineText, TextProps as MantineTextProps } from "@mantine/core";

type HeadingLevel = 1 | 2 | 3 | 4;

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, children, ...props }, ref) => {
    const order = level as 1 | 2 | 3 | 4 | 5 | 6;
    return (
      <Title ref={ref} order={order} {...props}>
        {children}
      </Title>
    );
  }
);
Heading.displayName = "Heading";

interface TextProps extends Omit<MantineTextProps, "c"> {
  variant?: "default" | "muted" | "inverse";
  // Explicitly allow children to avoid JSX inference issues
  children?: React.ReactNode;
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant = "default", ...props }, ref) => {
    let color: MantineTextProps["c"] = undefined;
    if (variant === "muted") {
      color = "dimmed";
    } else if (variant === "inverse") {
      color = "white";
    }

    return <MantineText ref={ref} c={color} {...props} />;
  }
);
Text.displayName = "Text";

export { Heading, Text };
