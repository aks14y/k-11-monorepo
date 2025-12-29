import { ReactNode } from "react";
// ThemeProvider is a no-op component kept for backward compatibility
// With Mantine, theming is handled via MantineProvider in bootstrap.tsx
// This component is kept for API compatibility

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Pass-through component for backward compatibility
  // MantineProvider handles theming via Mantine's theme system
  return <>{children}</>;
};

// Export design tokens for reference
export { theme } from "./design-tokens";

