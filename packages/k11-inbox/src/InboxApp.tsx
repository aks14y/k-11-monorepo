import { useState, useMemo } from "react";
import { Table, Checkbox, Pagination, ActionIcon, Badge, TextInput, Select, Loader, Text, Card, Stack, Button } from "@mantine/core";
import styles from "./InboxApp.module.css";
import { useNotifications, useMarkNotificationAsRead, useDeleteNotification, useQueues } from "./hooks/useNotifications";

// Simple icon components
const ChevronUp = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4l-4 4h8l-4-4z" />
  </svg>
);

const ChevronDown = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 12l4-4H4l4 4z" />
  </svg>
);

const MenuIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 4h12v1H2V4zm0 3h12v1H2V7zm0 3h12v1H2v-1z" />
  </svg>
);

type InboxAppProps = {
  onNotificationClick?: (id: string) => void;
  userEmail?: string;
  shellData?: {
    authToken: string | null;
    csrfToken: string | null;
    userEmail: string | null;
    hostUrl: string | null;
  };
};

type SortField = 'time' | 'source' | 'type' | 'subject' | 'status' | null;
type SortDirection = 'asc' | 'desc' | null;

export const InboxApp = ({ onNotificationClick, userEmail, shellData }: InboxAppProps) => {
  const [filter, setFilter] = useState<"all" | "personal" | "system">("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Use React Query to fetch notifications
  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useNotifications({
    page: currentPage,
    pageSize,
    search: searchQuery || undefined,
    filter: filter !== "all" ? filter : undefined,
    sortField: sortField || undefined,
    sortDirection: sortDirection || undefined,
  });

  // Mutations for marking as read and deleting
  const markAsReadMutation = useMarkNotificationAsRead();
  const deleteMutation = useDeleteNotification();

  // Fetch queues (automatically called on mount)
  const { data: queuesData, isLoading: queuesLoading, error: queuesError, refetch: refetchQueues } = useQueues();
  const [showQueues, setShowQueues] = useState(true); // Show queues by default on mount

  // Extract data from query response
  const notifications = notificationsData?.notifications || [];
  const totalNotifications = notificationsData?.total || 0;
  const totalPages = Math.ceil(totalNotifications / pageSize);

  // For now, use the notifications directly (API handles pagination/filtering/sorting)
  // If API doesn't handle client-side filtering, you can add it back here
  const paginatedNotifications = notifications;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedNotifications.map((n) => n.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const isAllSelected = paginatedNotifications.length > 0 && paginatedNotifications.every((n) => selectedRows.has(n.id));
  const isSomeSelected = paginatedNotifications.some((n) => selectedRows.has(n.id));

  const getStatusBadge = (type: "info" | "warning" | "error") => {
    const colors = {
      info: 'blue',
      warning: 'yellow',
      error: 'red',
    };
    return (
      <Badge color={colors[type]} variant="filled" size="sm">
        i
      </Badge>
    );
  };

  // Show loading state
  if (isLoading && notifications.length === 0) {
    return (
      <div className={styles.container}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  // Show error state
  if (isError && notifications.length === 0) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load notifications";
    return (
      <div className={styles.container}>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <Text c="red" size="lg" fw={500}>Error loading notifications</Text>
          <Text c="dimmed" size="sm" mt="xs">{errorMessage}</Text>
          <button
            onClick={() => refetch()}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            All ({totalNotifications})
          </h1>
          <div className={styles.breadcrumb}>Notification Queues ▸ All</div>
          {(userEmail || shellData?.userEmail) && (
            <div className={styles.userEmail}>
              Signed in as: {userEmail || shellData?.userEmail}
            </div>
          )}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <Button
            variant="light"
            size="sm"
            onClick={() => setShowQueues(!showQueues)}
          >
            {showQueues ? "Hide" : "Show"} Queues ({queuesData?.queues.length || 0})
          </Button>
        </div>
        <div className={styles.filters}>
          <label className={styles.filterLabel}>
            <input
              type="checkbox"
              checked={filter === "all"}
              onChange={() => setFilter("all")}
            />
            All
          </label>
          <label className={styles.filterLabel}>
            <input
              type="checkbox"
              checked={filter === "personal"}
              onChange={() => setFilter("personal")}
            />
            Personal
          </label>
          <label className={styles.filterLabel}>
            <input
              type="checkbox"
              checked={filter === "system"}
              onChange={() => setFilter("system")}
            />
            System
          </label>
        </div>
      </div>

      {/* Queues Section */}
      {showQueues && (
        <Card style={{ marginBottom: "16px", padding: "16px" }}>
          <Stack gap="12px">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text fw={600} size="lg">Notification Queues</Text>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => refetchQueues()}
                loading={queuesLoading}
              >
                Refresh
              </Button>
            </div>
            {queuesLoading ? (
              <Loader size="sm" />
            ) : queuesError ? (
              <Text c="red" size="sm">
                Error loading queues: {queuesError instanceof Error ? queuesError.message : "Unknown error"}
              </Text>
            ) : queuesData?.queues && queuesData.queues.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {queuesData.queues.map((queue) => (
                  <Card
                    key={queue.id}
                    style={{
                      padding: "12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      // You can add queue selection logic here
                      console.log("Selected queue:", queue);
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <Text fw={500}>{queue.name}</Text>
                        <Text size="xs" c="dimmed">
                          {queue.type} • {queue.companyName}
                        </Text>
                      </div>
                      <Badge variant="light" color={queue.type === "internal" ? "blue" : "green"}>
                        {queue.type}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Text c="dimmed" size="sm">No queues found</Text>
            )}
          </Stack>
        </Card>
      )}

      <div className={styles.searchWrapper}>
        <TextInput
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchQuery(e.currentTarget.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableWrapper}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className={styles.tableHeader}>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected && !isAllSelected}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.currentTarget.checked)}
                />
              </Table.Th>
              <Table.Th className={styles.tableHeaderStatus}>Status</Table.Th>
              <Table.Th
                className={`${styles.tableHeaderTime} ${styles.tableHeaderSortable}`}
                onClick={() => handleSort('time')}
              >
                <div className={styles.sortableHeader}>
                  Time
                  {sortField === 'time' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </Table.Th>
              <Table.Th
                className={`${styles.tableHeaderSource} ${styles.tableHeaderSortable}`}
                onClick={() => handleSort('source')}
              >
                <div className={styles.sortableHeader}>
                  Source
                  {sortField === 'source' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </Table.Th>
              <Table.Th
                className={`${styles.tableHeaderType} ${styles.tableHeaderSortable}`}
                onClick={() => handleSort('type')}
              >
                <div className={styles.sortableHeader}>
                  Type
                  {sortField === 'type' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </Table.Th>
              <Table.Th
                className={styles.tableHeaderSortable}
                onClick={() => handleSort('subject')}
              >
                <div className={styles.sortableHeader}>
                  Subject
                  {sortField === 'subject' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </Table.Th>
              <Table.Th
                className={`${styles.tableHeaderStatusCol} ${styles.tableHeaderSortable}`}
                onClick={() => handleSort('status')}
              >
                <div className={styles.sortableHeader}>
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </Table.Th>
              <Table.Th className={styles.tableHeaderAction}>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                  <Loader size="sm" />
                </Table.Td>
              </Table.Tr>
            ) : paginatedNotifications.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                  <Text c="dimmed">No notifications found</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedNotifications.map((notification) => (
              <Table.Tr key={notification.id}>
                <Table.Td>
                  <Checkbox
                    checked={selectedRows.has(notification.id)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectRow(notification.id, e.currentTarget.checked)}
                  />
                </Table.Td>
                <Table.Td>{getStatusBadge(notification.type)}</Table.Td>
                <Table.Td>{notification.time}</Table.Td>
                <Table.Td>{notification.source}</Table.Td>
                <Table.Td>
                  <Badge variant="light" size="sm">
                    {notification.type}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <a
                    href="#"
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      onNotificationClick?.(notification.id);
                    }}
                    className={styles.subjectLink}
                  >
                    {notification.subject}
                  </a>
                </Table.Td>
                <Table.Td>{notification.status}</Table.Td>
                <Table.Td>
                  <ActionIcon variant="subtle" size="sm">
                    <MenuIcon size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))
            )}
          </Table.Tbody>
        </Table>
      </div>

      <div className={styles.paginationContainer}>
        <div className={styles.paginationLeft}>
          <span>Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onChange={(value: string | null) => {
              if (value) {
                setPageSize(Number(value));
                setCurrentPage(1);
              }
            }}
            data={['10', '20', '50', '100']}
            className={styles.pageSizeSelect}
          />
        </div>
        <Pagination
          total={totalPages}
          value={currentPage}
          onChange={setCurrentPage}
        />
        <div className={styles.paginationRight}>
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalNotifications)} of {totalNotifications} notifications
        </div>
      </div>
    </div>
  );
};
