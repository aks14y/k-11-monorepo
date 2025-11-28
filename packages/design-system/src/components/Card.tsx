import { ReactNode } from "react";
import styled from "styled-components";

const Container = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

type CardProps = {
  children: ReactNode;
};

export const Card = ({ children }: CardProps) => <Container>{children}</Container>;

