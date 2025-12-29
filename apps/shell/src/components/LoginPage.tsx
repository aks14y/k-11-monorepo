import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Heading, Text, Stack, Button, Input } from "@design-system";
import { useAuth } from "../context/AuthContext";
import styles from "./LoginPage.module.css";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password.trim());
      navigate("/");
    } catch (err) {
      // Error is already set in AuthContext
      console.error("[LoginPage] Login failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <Card className={styles.card}>
        <Stack gap="16px">
          <Heading level={2}>Sign In</Heading>
          <Text variant="muted">Please enter your credentials to continue.</Text>
          {error && (
            <Text variant="muted" style={{ color: "var(--error, #d32f2f)" }}>
              {error}
            </Text>
          )}
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={loading || isSubmitting}
            />
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || isSubmitting}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={loading || isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Stack>
      </Card>
    </div>
  );
};
