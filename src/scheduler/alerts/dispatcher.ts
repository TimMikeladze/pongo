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

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a webhook payload to a channel with exponential backoff retry
 */
export async function dispatchWebhook(
  channel: ChannelConfig,
  payload: WebhookPayload,
): Promise<void> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(channel.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...channel.headers,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) return;

      // Don't retry 4xx errors (client errors won't fix themselves)
      if (response.status >= 400 && response.status < 500) {
        console.error(
          `[alerts] Webhook failed (no retry): ${channel.url} returned ${response.status}`,
        );
        return;
      }

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * 2 ** attempt;
        console.warn(
          `[alerts] Webhook returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await sleep(delay);
      } else {
        console.error(
          `[alerts] Webhook failed after ${MAX_RETRIES} retries: ${channel.url} returned ${response.status}`,
        );
      }
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * 2 ** attempt;
        console.warn(
          `[alerts] Webhook error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}): ${error instanceof Error ? error.message : error}`,
        );
        await sleep(delay);
      } else {
        console.error(
          `[alerts] Webhook failed after ${MAX_RETRIES} retries: ${channel.url}`,
          error instanceof Error ? error.message : error,
        );
      }
    }
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
