import React ,{ ReactNode } from "react";
import { ThemeProvider as SCThemeProvider, createGlobalStyle } from "styled-components";
import { theme } from "./design-tokens";

const GlobalStyles = createGlobalStyle`
  :root {
    font-family: ${theme.typography.fontFamily};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text.default};
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background-color: ${theme.colors.background};
  }
`;

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => (
  <SCThemeProvider theme={theme}>
    <GlobalStyles />
    {children}
  </SCThemeProvider>
);

export { theme };

