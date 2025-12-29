/**
 * Notifications API Service
 * Uses api-client for making API calls with automatic token handling
 */

import { apiFetch } from "api-client";

export type Notification = {
  id: string;
  time: string;
  source: string;
  type: "info" | "warning" | "error";
  subject: string;
  status: string;
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

/**
 * Fetch notifications from API
 */
export const fetchNotifications = async (
  params: FetchNotificationsParams = {}
): Promise<NotificationsResponse> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.filter && params.filter !== "all") queryParams.append("filter", params.filter);
    if (params.sortField) queryParams.append("sortField", params.sortField);
    if (params.sortDirection) queryParams.append("sortDirection", params.sortDirection);

    const queryString = queryParams.toString();
    const endpoint = `/k11/api/v1.0/notifications${queryString ? `?${queryString}` : ""}`;

    // Make API call using api-client (automatically includes CSRF and auth tokens)
    const response = await apiFetch(endpoint, {
      method: "GET",
    });

    // Transform response to match expected format
    // Adjust based on your actual API response structure
    if (Array.isArray(response)) {
      return {
        notifications: response,
        total: response.length,
      };
    }

    // If API returns object with notifications array
    if (response.notifications && Array.isArray(response.notifications)) {
      return {
        notifications: response.notifications,
        total: response.total || response.notifications.length,
        page: response.page,
        pageSize: response.pageSize,
      };
    }

    // Fallback: wrap single notification or empty array
    return {
      notifications: [],
      total: 0,
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

