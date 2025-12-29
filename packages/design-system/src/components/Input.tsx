import * as React from "react";
import { TextInput, TextInputProps } from "@mantine/core";

export interface InputProps extends TextInputProps {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ ...props }, ref) => {
    return <TextInput ref={ref} {...props} />;
  }
);
Input.displayName = "Input";

export { Input };
