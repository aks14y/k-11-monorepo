/**
 * React hook for fetching notifications using React Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchNotificationById,
  markNotificationAsRead,
  deleteNotification,
  type Notification,
  type FetchNotificationsParams,
} from "../services/notificationsService";

/**
 * Query keys for React Query
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params: FetchNotificationsParams) => [...notificationKeys.lists(), params] as const,
  details: () => [...notificationKeys.all, "detail"] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
};

/**
 * Hook to fetch notifications list
 */
export const useNotifications = (params: FetchNotificationsParams = {}) => {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    staleTime: 1000 * 30, // 30 seconds - data is fresh for 30s
    gcTime: 1000 * 60 * 5, // 5 minutes - cache for 5 minutes
  });
};

/**
 * Hook to fetch a single notification by ID
 */
export const useNotification = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => fetchNotificationById(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to mark notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (_: void, notificationId: string) => {
      // Invalidate and refetch notifications list
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      
      // Update the specific notification in cache if it exists
      queryClient.setQueryData<Notification>(
        notificationKeys.detail(notificationId),
        (old: Notification | undefined) => {
          if (old) {
            return { ...old, status: "read" };
          }
          return old;
        }
      );
    },
  });
};

/**
 * Hook to delete notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: (_: void, notificationId: string) => {
      // Invalidate and refetch notifications list
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      
      // Remove the notification from cache
      queryClient.removeQueries({ queryKey: notificationKeys.detail(notificationId) });
    },
  });
};

