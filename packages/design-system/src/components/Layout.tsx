import { ReactNode } from "react";
import styled from "styled-components";

const StackContainer = styled.div<{ $gap?: string; $direction?: "row" | "column" }>`
  display: flex;
  flex-direction: ${({ $direction }) => $direction ?? "column"};
  gap: ${({ $gap, theme }) => $gap ?? theme.spacing.md};
`;

type StackProps = {
  children: ReactNode;
  gap?: string;
  direction?: "row" | "column";
};

export const Stack = ({ children, gap, direction }: StackProps) => (
  <StackContainer $gap={gap} $direction={direction}>
    {children}
  </StackContainer>
);

const PageSectionRoot = styled.section`
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

type PageSectionProps = {
  children: ReactNode;
};

export const PageSection = ({ children }: PageSectionProps) => (
  <PageSectionRoot>{children}</PageSectionRoot>
);

