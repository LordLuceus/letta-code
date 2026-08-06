import type { ModCapabilities } from "./types";
export declare const MOD_CAPABILITY_IDS: readonly ["tools", "commands", "providers", "permissions", "events.lifecycle", "events.turns", "events.tools", "events.compact", "events.llm", "ui.panels"];
export type ModCapabilityId = (typeof MOD_CAPABILITY_IDS)[number];
export declare function isModCapabilityId(value: string): value is ModCapabilityId;
export declare const DEFAULT_MOD_CAPABILITIES: ModCapabilities;
export declare const DISABLED_MOD_CAPABILITIES: ModCapabilities;
export declare function cloneModCapabilities(capabilities: ModCapabilities): ModCapabilities;
export declare function resolveModCapabilities(capabilities?: ModCapabilities): ModCapabilities;
//# sourceMappingURL=capabilities.d.ts.map