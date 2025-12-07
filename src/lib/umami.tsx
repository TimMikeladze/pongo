"use client";

import Script from "next/script";

/**
 * Umami Analytics Integration
 *
 * Conditionally loads Umami analytics based on environment variables.
 * Set NEXT_PUBLIC_UMAMI_WEBSITE_ID and NEXT_PUBLIC_UMAMI_URL to enable.
 */

// Check if Umami is configured
export const isUmamiEnabled = () => {
  return !!(
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
    process.env.NEXT_PUBLIC_UMAMI_URL
  );
};

/**
 * Umami Script Component
 * Add this to your root layout to load Umami analytics
 */
export function UmamiScript() {
  if (!isUmamiEnabled()) {
    return null;
  }

  return (
    <Script
      async
      src={process.env.NEXT_PUBLIC_UMAMI_URL}
      data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
    />
  );
}

/**
 * Track a custom event
 * @param event - Event name
 * @param data - Optional event data
 */
export function trackEvent(event: string, data?: Record<string, unknown>) {
  if (!isUmamiEnabled()) return;

  if (typeof window !== "undefined") {
    // @ts-expect-error - umami is loaded via script tag
    window.umami?.track(event, data);
  }
}

/**
 * Identify a user
 * @param data - User identification data
 */
export function identifyUser(data: Record<string, unknown>) {
  if (!isUmamiEnabled()) return;

  if (typeof window !== "undefined") {
    // @ts-expect-error - umami is loaded via script tag
    window.umami?.identify(data);
  }
}

/**
 * Common event names for tracking
 */
export const UmamiEvents = {
  // Navigation
  PAGE_VIEW: "page_view",

  // Monitor actions
  MONITOR_CREATED: "monitor_created",
  MONITOR_VIEWED: "monitor_viewed",
  MONITOR_TRIGGERED: "monitor_triggered",

  // Dashboard actions
  DASHBOARD_CREATED: "dashboard_created",
  DASHBOARD_VIEWED: "dashboard_viewed",
  DASHBOARD_SHARED: "dashboard_shared",

  // Alert actions
  ALERT_VIEWED: "alert_viewed",

  // Settings
  SETTINGS_UPDATED: "settings_updated",

  // Public status page
  STATUS_PAGE_VIEWED: "status_page_viewed",
} as const;
