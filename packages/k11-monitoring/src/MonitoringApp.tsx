import styled from "styled-components";
import { Heading, Text, Stack } from "@design-system";

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const HeaderIcon = styled.div`
  width: 24px;
  height: 24px;
  position: relative;
  
  .icon-base {
    width: 100%;
    height: 100%;
    background-color: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.sm};
    position: relative;
    
    &::before {
      content: "";
      position: absolute;
      top: 4px;
      left: 4px;
      right: 4px;
      height: 2px;
      background-color: ${({ theme }) => theme.colors.text.muted};
      border-radius: 2px;
    }
    
    &::after {
      content: "";
      position: absolute;
      top: 8px;
      left: 4px;
      right: 4px;
      height: 2px;
      background-color: ${({ theme }) => theme.colors.text.muted};
      border-radius: 2px;
    }
  }
  
  .icon-overlay {
    position: absolute;
    top: -2px;
    left: -2px;
    width: 10px;
    height: 10px;
    background-color: #FCD34D;
    border-radius: 2px;
  }
`;

const Title = styled(Heading)`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSizes.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.default};
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 600px;
`;

const MonitoringCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const CardIcon = styled.div<{ type: "database" | "backup" }>`
  width: 64px;
  height: 64px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10B981;
  
  ${({ type }) => {
    if (type === "database") {
      return `
        svg {
          width: 100%;
          height: 100%;
        }
      `;
    } else {
      return `
        svg {
          width: 100%;
          height: 100%;
        }
      `;
    }
  }}
`;

const CardTitle = styled(Text)`
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.default};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-align: center;
`;

const CardSubtitle = styled(Text)`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: center;
`;

type MonitoringAppProps = {
  onCardClick?: (cardType: "database" | "backup") => void;
};

export const MonitoringApp = ({ onCardClick }: MonitoringAppProps) => {
  return (
    <Container>
      <Header>
        <HeaderIcon>
          <div className="icon-base" />
          <div className="icon-overlay" />
        </HeaderIcon>
        <Title level={1}>Monitoring</Title>
      </Header>

      <CardsContainer>
        <MonitoringCard onClick={() => onCardClick?.("database")}>
          <CardIcon type="database">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Database icon - rectangle with horizontal lines and play button on left */}
              <rect x="20" y="16" width="32" height="32" rx="3" fill="currentColor" opacity="0.15" />
              <line x1="26" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="26" y1="32" x2="46" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="26" y1="40" x2="46" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              {/* Play button triangle on the left */}
              <polygon points="8,32 20,24 20,40" fill="currentColor" />
            </svg>
          </CardIcon>
          <CardTitle>Database</CardTitle>
          <CardSubtitle>Database</CardSubtitle>
        </MonitoringCard>

        <MonitoringCard onClick={() => onCardClick?.("backup")}>
          <CardIcon type="backup">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Backup icon - circular arrow (counter-clockwise) with clock inside */}
              <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="3" />
              {/* Circular arrow path */}
              <path
                d="M 32 10 A 22 22 0 0 1 50 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 46 14 L 50 18 L 46 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Clock inside the circle */}
              <circle cx="32" cy="32" r="2" fill="currentColor" />
              {/* Hour hand pointing to 10 */}
              <line
                x1="32"
                y1="32"
                x2="28"
                y2="28"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Minute hand pointing to 12 */}
              <line
                x1="32"
                y1="32"
                x2="32"
                y2="24"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </CardIcon>
          <CardTitle>Backup</CardTitle>
          <CardSubtitle>Backup</CardSubtitle>
        </MonitoringCard>
      </CardsContainer>
    </Container>
  );
};

