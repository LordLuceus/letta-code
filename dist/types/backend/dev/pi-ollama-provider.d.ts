import type { Provider } from "@earendil-works/pi-ai";
export declare const OLLAMA_PI_PROVIDER_ID = "ollama";
export declare const OLLAMA_CLOUD_PI_PROVIDER_ID = "ollama-cloud";
export interface OllamaPiProviderOptions {
    /** Base URL as configured; `/v1` is appended/stripped as needed. */
    baseURL: string;
    apiKey?: string;
    fetchImpl?: typeof fetch;
    discoveryTimeoutMs?: number;
    /** Defaults to the local Ollama provider; Ollama Cloud reuses this factory. */
    providerId?: string;
    name?: string;
}
/**
 * Real dynamic pi-ai Provider for an Ollama endpoint (local daemon or
 * Ollama Cloud — both speak the same native API). See
 * `createLocalEndpointPiProvider` for the shared refresh/auth semantics.
 */
export declare function createOllamaPiProvider(options: OllamaPiProviderOptions): Provider<"openai-completions">;
//# sourceMappingURL=pi-ollama-provider.d.ts.map