export const colors = {
  primary: "#3B82F6",
  primaryDark: "#1D4ED8",
  secondary: "#10B981",
  background: "#F5F7FB",
  surface: "#FFFFFF",
  text: {
    default: "#0F172A",
    muted: "#475569",
    inverse: "#FFFFFF"
  },
  border: "#E2E8F0",
  danger: "#EF4444",
  error: "#EF4444",
  warning: "#F59E0B",
  success: "#22C55E"
};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px"
};

export const radii = {
  sm: "4px",
  md: "8px",
  pill: "999px"
};

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSizes: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "20px",
    xl: "28px"
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7
  }
};

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  shadows: {
    sm: "0px 1px 2px rgba(15, 23, 42, 0.08)",
    md: "0px 4px 12px rgba(15, 23, 42, 0.1)"
  }
};

export type Theme = typeof theme;

