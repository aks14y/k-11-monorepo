import { ButtonHTMLAttributes } from "react";
import styled from "styled-components";

const StyledButton = styled.button<{ variant: "primary" | "secondary" | "ghost" }>`
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  background-color: ${({ theme, variant }) =>
    variant === "secondary"
      ? theme.colors.secondary
      : variant === "ghost"
      ? "transparent"
      : theme.colors.primary};
  color: ${({ theme, variant }) =>
    variant === "ghost" ? theme.colors.primary : theme.colors.text.inverse};
  border: ${({ theme, variant }) =>
    variant === "ghost" ? `1px solid ${theme.colors.primary}` : "none"};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  &:hover {
    background-color: ${({ theme, variant }) =>
      variant === "secondary"
        ? theme.colors.success
        : variant === "ghost"
        ? theme.colors.primaryDark
        : theme.colors.primaryDark};
    color: ${({ theme }) => theme.colors.text.inverse};
  }
`;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = ({ variant = "primary", children, ...rest }: ButtonProps) => (
  <StyledButton variant={variant} {...rest}>
    {children}
  </StyledButton>
);

