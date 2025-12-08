// src/scheduler/alerts/dispatcher.ts
import type { WebhookPayload } from "./types";

/**
 * Channel configuration
 */
export interface ChannelConfig {
  type: "webhook";
  url: string;
  headers?: Record<string, string>;
}

/**
 * Channels configuration map
 */
export type ChannelsConfig = Record<string, ChannelConfig>;

/**
 * Send a webhook payload to a channel
 */
export async function dispatchWebhook(
  channel: ChannelConfig,
  payload: WebhookPayload,
): Promise<void> {
  try {
    const response = await fetch(channel.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...channel.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `[alerts] Webhook failed: ${channel.url} returned ${response.status}`,
      );
    }
  } catch (error) {
    console.error(
      `[alerts] Webhook error: ${channel.url}`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Dispatch payload to multiple channels
 */
export async function dispatchToChannels(
  channelIds: string[],
  channels: ChannelsConfig,
  payload: WebhookPayload,
): Promise<void> {
  const dispatches = channelIds.map(async (channelId) => {
    const channel = channels[channelId];
    if (!channel) {
      console.warn(`[alerts] Unknown channel: ${channelId}`);
      return;
    }
    await dispatchWebhook(channel, payload);
  });

  await Promise.all(dispatches);
}
