import { ReactNode } from "react";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  max-width: 480px;
  width: 90%;
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

type ModalProps = {
  open: boolean;
  children: ReactNode;
  onClose?: () => void;
};

export const Modal = ({ open, children, onClose }: ModalProps) => {
  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Wrapper onClick={(event) => event.stopPropagation()}>{children}</Wrapper>
    </Overlay>
  );
};

