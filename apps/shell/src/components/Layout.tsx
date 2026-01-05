import { ReactNode } from "react";
import { Button, Stack } from "@design-system";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import type { Plugin } from "@plugin-registry";
import styles from "./Layout.module.css";

type LayoutProps = {
  children: ReactNode;
  plugins?: Plugin[];
};

export const Layout = ({
  children,
  plugins = []
}: LayoutProps) => {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleThemeToggle = () => {
    toggleTheme();
    // Mantine color scheme is synced automatically via forceColorScheme in bootstrap.tsx
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <strong className={styles.headerTitle}>Shell Host</strong>
        <nav className={styles.nav}>
          <Link 
            to="/" 
            className={styles.link}
          >
            Dashboard
          </Link>
          {plugins
            .filter((plugin) => plugin.enabled)
            .map((plugin) => (
              <Link 
                key={plugin.id} 
                to={plugin.route} 
                className={styles.link}
              >
                {plugin.metadata.title}
              </Link>
            ))}
        </nav>
        <Stack direction="row" gap="8px">
          <button
            onClick={handleThemeToggle}
            className={styles.themeButton}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.themeIcon}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.themeIcon}>
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>
          {isAuthenticated ? (
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Link to="/auth" className={styles.loginLink}>
              <Button>Login</Button>
            </Link>
          )}
        </Stack>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
};
