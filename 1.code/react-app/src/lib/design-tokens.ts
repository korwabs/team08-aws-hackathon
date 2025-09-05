// Lilys AI Design Tokens
export const designTokens = {
  colors: {
    // Primary colors from Lilys AI
    primary: {
      DEFAULT: "rgb(102, 99, 253)", // Purple accent color
      foreground: "rgb(255, 255, 255)",
      hover: "rgb(92, 89, 243)",
    },
    // Background colors
    background: {
      DEFAULT: "rgb(255, 255, 255)",
      secondary: "rgb(249, 250, 251)",
      tertiary: "rgb(244, 244, 245)",
    },
    // Text colors
    foreground: {
      DEFAULT: "rgb(24, 24, 27)", // Main text
      secondary: "rgb(82, 82, 91)", // Secondary text
      muted: "rgb(113, 113, 122)", // Muted text
      light: "rgb(161, 161, 170)", // Light text
    },
    // Border colors
    border: {
      DEFAULT: "rgb(229, 231, 235)",
      secondary: "rgb(228, 228, 231)",
    },
    // Accent colors
    accent: {
      yellow: "rgb(223, 255, 50)", // Bright yellow accent
      purple: "rgb(237, 240, 255)", // Light purple background
    },
    // Status colors
    destructive: {
      DEFAULT: "rgb(239, 68, 68)",
      foreground: "rgb(255, 255, 255)",
    },
    // Card colors
    card: {
      DEFAULT: "rgb(255, 255, 255)",
      foreground: "rgb(24, 24, 27)",
    },
  },
  
  typography: {
    fontFamily: {
      primary: "Pretendard, -apple-system, 'system-ui', 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
      secondary: "Inter, ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    },
    fontSize: {
      base: "16px",
      sm: "14px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
    },
    lineHeight: {
      base: "24px",
      tight: "20px",
      relaxed: "28px",
    },
  },
  
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },
  
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
  
  shadows: {
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
} as const
