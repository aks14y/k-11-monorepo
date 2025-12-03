import { useState } from "react";
import styled from "styled-components";
import { Card, Button, Stack, Heading, Text } from "@design-system";

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSizes.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.default};
`;

const Breadcrumb = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const FilterSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FilterCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.default};
  cursor: pointer;
  
  input[type="checkbox"] {
    cursor: pointer;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.default};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

const TableContainer = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TableHeaderCell = styled.th`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: left;
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.default};
  
  &:first-child {
    padding-left: ${({ theme }) => theme.spacing.lg};
  }
  
  &:last-child {
    padding-right: ${({ theme }) => theme.spacing.lg};
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.default};
  
  &:first-child {
    padding-left: ${({ theme }) => theme.spacing.lg};
  }
  
  &:last-child {
    padding-right: ${({ theme }) => theme.spacing.lg};
  }
`;

const CheckboxCell = styled(TableCell)`
  width: 40px;
`;

const IconCell = styled(TableCell)`
  width: 40px;
  color: ${({ theme }) => theme.colors.primary};
`;

const TimeCell = styled(TableCell)`
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.text.muted};
`;

const SourceCell = styled(TableCell)`
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
`;

const TypeIcon = styled.div<{ type: "info" | "warning" | "error" }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, type }) => 
    type === "info" ? theme.colors.primary : 
    type === "warning" ? theme.colors.warning : 
    theme.colors.error
  };
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

const SubjectLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.default};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

const PaginationInfo = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme, active }) => 
    active ? theme.colors.primary : theme.colors.surface
  };
  color: ${({ theme, active }) => 
    active ? theme.colors.text.inverse : theme.colors.text.default
  };
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  
  &:hover:not(:disabled) {
    background-color: ${({ theme, active }) => 
      active ? theme.colors.primaryDark : theme.colors.surface
    };
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

type Notification = {
  id: string;
  time: string;
  source: string;
  type: "info" | "warning" | "error";
  subject: string;
  status: string;
};

type InboxAppProps = {
  onNotificationClick?: (id: string) => void;
  userEmail?: string;
};

const mockNotifications: Notification[] = Array.from({ length: 10 }, (_, i) => ({
  id: `notif-${i + 1}`,
  time: new Date(Date.now() - i * 10000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short"
  }),
  source: "Reports",
  type: "info" as const,
  subject: "Report Generated -testscheulder",
  status: "Report Generated"
}));

export const InboxApp = ({ onNotificationClick, userEmail }: InboxAppProps) => {
  const [filter, setFilter] = useState<"all" | "personal" | "system">("all");
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 7;
  const totalNotifications = 330;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(new Set(mockNotifications.map(n => n.id)));
    } else {
      setSelectedNotifications(new Set());
    }
  };

  const handleSelectNotification = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedNotifications);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedNotifications(newSelected);
  };

  return (
    <Container>
      <Header>
        <TitleSection>
          <Title>All ({totalNotifications})</Title>
          <Breadcrumb>Notification Queues ▸ All</Breadcrumb>
          {userEmail && (
            <Breadcrumb style={{ marginTop: "4px" }}>
              Signed in as: {userEmail}
            </Breadcrumb>
          )}
        </TitleSection>
        <FilterSection>
          <FilterCheckbox>
            <input
              type="checkbox"
              checked={filter === "all"}
              onChange={() => setFilter("all")}
            />
            All
          </FilterCheckbox>
          <FilterCheckbox>
            <input
              type="checkbox"
              checked={filter === "personal"}
              onChange={() => setFilter("personal")}
            />
            Personal
          </FilterCheckbox>
          <FilterCheckbox>
            <input
              type="checkbox"
              checked={filter === "system"}
              onChange={() => setFilter("system")}
            />
            System
          </FilterCheckbox>
          <IconButton aria-label="Refresh">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z"/>
              <path d="M8 3.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1H8.5V4a.5.5 0 0 0-.5-.5z"/>
            </svg>
          </IconButton>
          <IconButton aria-label="Menu">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 4h12v1H2V4zm0 3h12v1H2V7zm0 3h12v1H2v-1z"/>
            </svg>
          </IconButton>
        </FilterSection>
      </Header>

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === mockNotifications.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableHeaderCell>
              <TableHeaderCell>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                  <text x="8" y="11" textAnchor="middle" fontSize="10" fill="currentColor">?</text>
                </svg>
              </TableHeaderCell>
              <TableHeaderCell>Time</TableHeaderCell>
              <TableHeaderCell>Source</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {mockNotifications.map((notification) => (
              <TableRow key={notification.id}>
                <CheckboxCell>
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={(e) => handleSelectNotification(notification.id, e.target.checked)}
                  />
                </CheckboxCell>
                <IconCell>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z"/>
                    <path d="M8 3.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1H8.5V4a.5.5 0 0 0-.5-.5z"/>
                  </svg>
                </IconCell>
                <TimeCell>{notification.time}</TimeCell>
                <SourceCell>{notification.source}</SourceCell>
                <TableCell>
                  <TypeIcon type={notification.type}>i</TypeIcon>
                </TableCell>
                <TableCell>
                  <SubjectLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onNotificationClick?.(notification.id);
                    }}
                  >
                    {notification.subject}
                  </SubjectLink>
                </TableCell>
                <TableCell>
                  <StatusBadge>{notification.status}</StatusBadge>
                </TableCell>
                <TableCell>
                  <IconButton aria-label="Actions">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2 4h12v1H2V4zm0 3h12v1H2V7zm0 3h12v1H2v-1z"/>
                    </svg>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationContainer>
          <PaginationInfo>Page: {currentPage}/{totalPages}</PaginationInfo>
          <PaginationControls>
            <PaginationButton
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </PaginationButton>
            <PaginationButton
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </PaginationButton>
            {[1, 2, 3, 4, 5].map((page) => (
              <PaginationButton
                key={page}
                active={currentPage === page}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </PaginationButton>
            ))}
            {totalPages > 5 && <span>...</span>}
            <PaginationButton
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </PaginationButton>
            <PaginationButton
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </PaginationButton>
          </PaginationControls>
        </PaginationContainer>
      </TableContainer>
    </Container>
  );
};

