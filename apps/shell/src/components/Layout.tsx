import React, { ReactNode } from "react";
import styled from "styled-components";
import { Button, Stack } from "@design-system";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const NavLinks = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};

  a {
    text-decoration: none;
    color: ${({ theme }) => theme.colors.text.default};
    font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  }
`;

const Main = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl};
`;

type LayoutProps = {
  children: ReactNode;
  showInbox?: boolean;
  showMonitoring?: boolean;
};

export const Layout = ({
  children,
  showInbox = true,
  showMonitoring = true
}: LayoutProps) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <Container>
      <Header>
        <strong>Shell Host</strong>
        <NavLinks>
          <Link to="/">Dashboard</Link>
          {showInbox && <Link to="/inbox">Inbox</Link>}
          {showMonitoring && <Link to="/monitoring">Monitoring</Link>}
        </NavLinks>
        <Stack direction="row" gap="8px">
          {isAuthenticated ? (
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Link to="/auth" style={{ textDecoration: "none" }}>
              <Button>Login</Button>
            </Link>
          )}
        </Stack>
      </Header>
      <Main>{children}</Main>
    </Container>
  );
};

