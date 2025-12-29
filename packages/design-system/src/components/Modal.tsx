import * as React from "react";
import { Modal as MantineModal, ModalProps as MantineModalProps } from "@mantine/core";

export interface ModalProps extends Omit<MantineModalProps, "opened" | "onClose"> {
  open: boolean;
  onClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children, ...props }) => {
  return (
    <MantineModal opened={open} onClose={onClose || (() => {})} {...props}>
      {children}
    </MantineModal>
  );
};

const ModalRoot = Modal;
const ModalPortal = React.Fragment;
const ModalOverlay = React.Fragment;
const ModalClose = React.Fragment;
const ModalTrigger = React.Fragment;

const ModalHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const ModalFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const ModalTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h2 className={className} {...props}>
    {children}
  </h2>
);

const ModalDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={className} {...props}>
    {children}
  </p>
);

const ModalContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => <>{children}</>;

export {
  ModalRoot,
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalClose,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
};
