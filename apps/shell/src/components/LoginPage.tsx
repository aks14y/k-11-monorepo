import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Card, Heading, Text, Stack, Button, Input } from "@design-system";
import { useAuth } from "../context/AuthContext";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  padding: ${({ theme }) => theme.spacing.lg};
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 400px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.trim()) {
      login(email.trim());
      navigate("/");
    }
  };

  return (
    <Container>
      <StyledCard>
        <Stack gap="16px">
          <Heading level={2}>Sign In</Heading>
          <Text variant="muted">Please enter your email to continue.</Text>
          <Form onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" variant="primary">
              Sign In
            </Button>
          </Form>
        </Stack>
      </StyledCard>
    </Container>
  );
};

