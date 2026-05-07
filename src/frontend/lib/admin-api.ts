import { apiFetch } from "./api-client";

const ADMIN = "/admin";

// Stats
export function fetchAdminStats() {
  return apiFetch<any>(`${ADMIN}/stats`);
}

// Events
export function fetchAdminEvents(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<any>(`${ADMIN}/events${qs}`);
}

export function fetchAdminEvent(id: string) {
  return apiFetch<any>(`${ADMIN}/events/${id}`);
}

export function createAdminEvent(data: any) {
  return apiFetch<any>(`${ADMIN}/events`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminEvent(id: string, data: any) {
  return apiFetch<any>(`${ADMIN}/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function triggerMatching(eventId: string) {
  return apiFetch<any>(`${ADMIN}/events/${eventId}/run-matching`, {
    method: "POST",
  });
}

export function fetchEventAttendees(eventId: string) {
  return apiFetch<any>(`${ADMIN}/events/${eventId}/attendees`);
}

export function bulkEventAction(eventIds: string[], action: string) {
  return apiFetch<any>(`${ADMIN}/events/bulk-action`, {
    method: "POST",
    body: JSON.stringify({ event_ids: eventIds, action }),
  });
}

// Users
export function fetchAdminUsers(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<any>(`${ADMIN}/users${qs}`);
}

export function fetchAdminUser(id: string) {
  return apiFetch<any>(`${ADMIN}/users/${id}`);
}

export function userAction(id: string, action: string) {
  return apiFetch<any>(`${ADMIN}/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({ action }),
  });
}

// Hosts
export function fetchAdminHosts() {
  return apiFetch<any>(`${ADMIN}/hosts`);
}

export function toggleHostActive(hostId: string) {
  return apiFetch<any>(`${ADMIN}/hosts/${hostId}/toggle-active`, {
    method: "PUT",
  });
}

// Moderation
export function fetchFlaggedUsers(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<any>(`${ADMIN}/moderation/flags${qs}`);
}

export function resolveFlag(flagId: string, data: { admin_notes?: string; action: string }) {
  return apiFetch<any>(`${ADMIN}/moderation/flags/${flagId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function fetchSOSIncidents(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<any>(`${ADMIN}/moderation/sos${qs}`);
}

export function resolveSOS(sosId: string, data: { admin_notes?: string; action: string }) {
  return apiFetch<any>(`${ADMIN}/moderation/sos/${sosId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function fetchChatAudit(groupId: string) {
  return apiFetch<any>(`${ADMIN}/moderation/chat/${groupId}`);
}

// Config
export function fetchPlatformConfig() {
  return apiFetch<any>(`${ADMIN}/config`);
}

export function updatePlatformConfig(data: Record<string, any>) {
  return apiFetch<any>(`${ADMIN}/config`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Notifications
export function fetchAdminNotifications() {
  return apiFetch<any>(`${ADMIN}/notifications`);
}

export function sendAdminNotification(data: { title: string; body: string; target_type: string; target_id?: string; scheduled_at?: string }) {
  return apiFetch<any>(`${ADMIN}/notifications`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Platform Report
export function fetchPlatformReport() {
  return apiFetch<any>(`${ADMIN}/report/platform`);
}

// Image Upload
export function uploadImage(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<any>(`${ADMIN}/upload-image`, {
    method: "POST",
    body: formData,
    headers: {}, // Let browser set Content-Type with boundary
  });
}
