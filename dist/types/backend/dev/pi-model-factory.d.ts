import type { Api, Model, ThinkingLevel } from "@earendil-works/pi-ai";
import { type LocalProviderTimeout } from "../local/local-provider-timeout";
import { LocalPiModelsRuntime } from "./pi-models-runtime";
import { type PiProvider } from "./pi-provider-registry";
export declare const DEFAULT_PI_PROVIDER = "openai";
export declare const UNSELECTED_LOCAL_MODEL_HANDLE = "local/default";
export type { PiProvider } from "./pi-provider-registry";
export declare function isUnselectedLocalModelHandle(model: unknown): boolean;
export declare function reasoningForSettings(modelSettings: Record<string, unknown>, modelHandle?: string): ThinkingLevel | undefined;
export interface PiModelSettings {
    provider_type?: unknown;
    context_window_limit?: unknown;
    max_tokens?: unknown;
    service_tier?: unknown;
}
export interface PiModelFactoryOptions {
    provider?: string;
    model?: string;
    localProviderAuthStorageDir?: string;
    preferredProviderType?: string;
    /**
     * Per-backend pi-ai Models runtime. Runtime-managed providers (local
     * endpoints and mod registrations) resolve to the complete Model object
     * published by the provider that discovered it; a call-scoped runtime is
     * created when omitted. Models are never fabricated from name strings.
     */
    modelsRuntime?: LocalPiModelsRuntime;
}
export interface ResolvedPiModel {
    provider: PiProvider;
    model: Model<Api>;
    apiKey?: string;
    timeout: LocalProviderTimeout;
    headers?: Record<string, string>;
    providerOptions?: Record<string, unknown>;
    envOverrides?: Record<string, string | undefined>;
}
export declare function applyPiEnvOverrides(overrides: Record<string, string | undefined> | undefined): () => void;
export declare function resolvePiProvider(provider?: string): PiProvider;
export declare function resolvePiProviderFromAgent(model: string | undefined, modelSettings?: PiModelSettings): PiProvider;
export declare function resolvePiModelFromAgent(model: string | undefined, provider: PiProvider): string | undefined;
export interface ZaiConnection {
    apiKey?: string;
    baseURL: string;
    providerName: "zai" | "zai-coding";
    timeout: LocalProviderTimeout;
}
export declare function resolveZaiConnection(options: {
    storageDir?: string;
    preferredProviderType?: "zai" | "zai_coding";
}): ZaiConnection;
export declare function resolvePiModelForAgent(modelHandle: string | undefined, modelSettings?: PiModelSettings, options?: PiModelFactoryOptions): Promise<ResolvedPiModel>;
//# sourceMappingURL=pi-model-factory.d.ts.map