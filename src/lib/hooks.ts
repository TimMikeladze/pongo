"use client"

import { useSyncExternalStore, useMemo } from "react"
import { store } from "./store"

function useStoreVersion() {
  return useSyncExternalStore(
    store.subscribe.bind(store),
    () => store.getVersion(),
    () => store.getVersion(),
  )
}

export function useMonitors() {
  useStoreVersion()
  return store.getMonitors()
}

export function useMonitor(id: string) {
  useStoreVersion()
  return store.getMonitor(id)
}

export function useDashboards() {
  useStoreVersion()
  return store.getDashboards()
}

export function useDashboard(id: string) {
  useStoreVersion()
  return store.getDashboard(id)
}

export function useDashboardBySlug(slug: string) {
  useStoreVersion()
  return store.getDashboardBySlug(slug)
}

export function useNotificationChannels() {
  useStoreVersion()
  return store.getNotificationChannels()
}

export function useCheckResults(monitorId: string, limit?: number) {
  useStoreVersion()
  return store.getCheckResults(monitorId, limit)
}

export function useLatestCheckResult(monitorId: string) {
  useStoreVersion()
  return store.getLatestCheckResult(monitorId)
}

export function useMonitorStats(monitorId: string, hours = 24) {
  const version = useStoreVersion()
  return useMemo(
    () => ({
      uptime: store.getUptimePercentage(monitorId, hours),
      avgResponseTime: store.getAverageResponseTime(monitorId, hours),
    }),
    [monitorId, hours, version],
  )
}

export function useAnnouncements(dashboardId?: string) {
  useStoreVersion()
  return store.getAnnouncements(dashboardId)
}

export function useIncidents(dashboardId?: string) {
  useStoreVersion()
  return store.getIncidents(dashboardId)
}

export function useActiveIncidents(dashboardId?: string) {
  useStoreVersion()
  return store.getActiveIncidents(dashboardId)
}

export function useMaintenanceWindows(dashboardId?: string) {
  useStoreVersion()
  return store.getMaintenanceWindows(dashboardId)
}

export function useUpcomingMaintenance(dashboardId?: string) {
  useStoreVersion()
  return store.getUpcomingMaintenance(dashboardId)
}

export function useSubscribers(dashboardId: string) {
  useStoreVersion()
  return store.getSubscribers(dashboardId)
}

export function useSLAStatus(dashboardId: string, days = 30) {
  const version = useStoreVersion()
  return useMemo(() => store.getSLAStatus(dashboardId, days), [dashboardId, days, version])
}

export function useDailyStatus(monitorId: string, days = 90) {
  const version = useStoreVersion()
  return useMemo(() => store.getDailyStatus(monitorId, days), [monitorId, days, version])
}
