/**
 * Notifications API Service
 * Uses api-client for making API calls with automatic token handling
 */

import { apiFetch } from "@api-client";

export type Notification = {
  id: string;
  time: string;
  source: string;
  type: "info" | "warning" | "error";
  subject: string;
  status: string;
};

export type ApiNotificationItem = {
  id: string;
  eventCategory?: string;
  eventType?: string;
  logTime: string;
  eventOccurenceTime?: string;
  source: string;
  subject: string;
  messageStatus?: string;
  priority?: number;
  [key: string]: any; // For originalData
};

export type ApiResponse = {
  data: ApiNotificationItem[];
  total?: number;
  [key: string]: any;
};

export type NotificationsResponse = {
  notifications: Notification[];
  total: number;
  page?: number;
  pageSize?: number;
};

export type FetchNotificationsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: "all" | "personal" | "system";
  sortField?: string;
  sortDirection?: "asc" | "desc";
};

export type Queue = {
  id: number;
  name: string;
  status: string | null;
  ownerId: number | string | null;
  type: string; // e.g., "internal", "user"
  companyName: string;
  description: string | null;
};

export type QueuesResponse = {
  queues: Queue[];
  total?: number;
};

/**
 * Format date to readable string
 */
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  } catch (error) {
    console.error("[formatDate] Error formatting date:", error);
    return dateString;
  }
};

/**
 * Map eventType/eventCategory to Notification type
 */
const mapEventType = (eventType?: string, eventCategory?: string): "info" | "warning" | "error" => {
  const type = (eventType || eventCategory || "").toLowerCase();
  if (type.includes("error") || type.includes("critical")) return "error";
  if (type.includes("warning") || type.includes("alert")) return "warning";
  return "info";
};

/**
 * Fetch notifications from API
 */
export const fetchNotifications = async (
  params: FetchNotificationsParams = {}
): Promise<NotificationsResponse> => {
  try {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const start = (page - 1) * pageSize;
    const count = pageSize;

    // Build the endpoint with start and count parameters
    const endpoint = `/k11inbox/api/v1.0/queue/data?start=${start}&count=${count}`;

    // Make API call using api-client (automatically includes CSRF and auth tokens)
    const response = await apiFetch(endpoint, {
      method: "GET",
    });

    // Transform API response to match expected format
    if (!response || !response.data || !Array.isArray(response.data)) {
      console.warn("[notificationsService] Invalid API response structure:", response);
      return {
        notifications: [],
        total: 0,
        page,
        pageSize,
      };
    }

    // Transform each item from API format to Notification format
    const transformedData: Notification[] = response.data.map((item: ApiNotificationItem) => ({
      id: item.id,
      time: formatDate(item.logTime) || item.logTime || "",
      source: item.source || "",
      type: mapEventType(item.eventType, item.eventCategory),
      subject: item.subject || "",
      status: item.messageStatus || "active",
    }));

    // Get total from response or use array length
    const total = response.total || response.data.length;

    return {
      notifications: transformedData,
      total,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("[notificationsService] Failed to fetch notifications:", error);
    throw error;
  }
};

/**
 * Fetch a single notification by ID
 */
export const fetchNotificationById = async (id: string): Promise<Notification> => {
  try {
    const response = await apiFetch(`/k11/api/v1.0/notifications/${id}`, {
      method: "GET",
    });

    return response as Notification;
  } catch (error) {
    console.error(`[notificationsService] Failed to fetch notification ${id}:`, error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    await apiFetch(`/k11/api/v1.0/notifications/${id}/read`, {
      method: "POST",
    });
  } catch (error) {
    console.error(`[notificationsService] Failed to mark notification ${id} as read:`, error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (id: string): Promise<void> => {
  try {
    await apiFetch(`/k11/api/v1.0/notifications/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error(`[notificationsService] Failed to delete notification ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch notification queues from API
 */
export const fetchQueues = async (): Promise<QueuesResponse> => {
  try {
    const endpoint = `/k11inbox/api/v1.0/notification/queues`;

    // Make API call using api-client (automatically includes CSRF and auth tokens)
    const response = await apiFetch(endpoint, {
      method: "GET",
    });

    // Transform API response to match expected format
    if (Array.isArray(response)) {
      return {
        queues: response as Queue[],
        total: response.length,
      };
    }

    // If API returns object with queues array
    if (response.queues && Array.isArray(response.queues)) {
      return {
        queues: response.queues as Queue[],
        total: response.total || response.queues.length,
      };
    }

    // If API returns object with data array
    if (response.data && Array.isArray(response.data)) {
      return {
        queues: response.data as Queue[],
        total: response.total || response.data.length,
      };
    }

    // Fallback: empty array
    console.warn("[notificationsService] Invalid queues API response structure:", response);
    return {
      queues: [],
      total: 0,
    };
  } catch (error) {
    console.error("[notificationsService] Failed to fetch queues:", error);
    throw error;
  }
};

