// src/scheduler/alerts/index.ts
export { evaluateCondition } from "./conditions";
export type { ChannelConfig, ChannelsConfig } from "./dispatcher";
export { dispatchToChannels, dispatchWebhook } from "./dispatcher";
export { evaluateAlerts } from "./evaluator";
export type { FlapResult, FlapState } from "./flap-detection";
export { trackStateTransition } from "./flap-detection";
export type {
  AlertCondition,
  AlertConfig,
  AlertEventType,
  AlertSeverity,
  AlertSnapshot,
  AlertStatus,
  CheckResultWithId,
  ConditionCallback,
  DeclarativeCondition,
  WebhookPayload,
} from "./types";
