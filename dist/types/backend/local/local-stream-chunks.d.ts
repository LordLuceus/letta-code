import type { AssistantMessageEvent } from "@earendil-works/pi-ai";
import type { LocalMessage } from "./local-message";
export type ProviderStreamPart = AssistantMessageEvent;
export declare function attachLocalMessage<T extends object>(target: T, message: LocalMessage): T;
export declare function getAttachedLocalMessage(value: unknown): LocalMessage | undefined;
export declare function markLocalStateChunkOnly<T extends object>(target: T): T;
export declare function isLocalStateChunkOnly(value: unknown): boolean;
//# sourceMappingURL=local-stream-chunks.d.ts.map