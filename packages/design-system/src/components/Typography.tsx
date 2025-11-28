import { ReactNode } from "react";
import styled from "styled-components";

type HeadingProps = {
  level?: 1 | 2 | 3 | 4;
  children: ReactNode;
};

const headingSizes = {
  1: "xl",
  2: "lg",
  3: "md",
  4: "sm"
} as const;

const HeadingBase = styled.h1<{ $level: number }>`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme, $level }) =>
    theme.typography.fontSizes[headingSizes[$level as 1 | 2 | 3 | 4]]};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
`;

export const Heading = ({ level = 2, children }: HeadingProps) => (
  <HeadingBase as={`h${level}` as const} $level={level}>
    {children}
  </HeadingBase>
);

type TextProps = {
  variant?: "muted" | "default" | "inverse";
  children: ReactNode;
};

const TextBase = styled.p<{ $variant: TextProps["variant"] }>`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme, $variant }) => theme.colors.text[$variant ?? "default"]};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
`;

export const Text = ({ variant = "default", children }: TextProps) => (
  <TextBase $variant={variant}>{children}</TextBase>
);

