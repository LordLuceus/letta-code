import type { ModEvents } from "../../mods/event-emitter";
import { type ModAdapter } from "../../mods/mod-adapter";
import type { ModCapabilities, ModContext } from "../../mods/types";
import { ensureMemfsSyncedForAgent } from "./memfs-sync";
import type { ListenerRuntime } from "./types";
export declare const LISTENER_MOD_CAPABILITIES: ModCapabilities;
export interface CreateListenerModAdapterOptions {
    agentModsDirectory?: string;
    cacheDirectory?: string;
    capabilities?: ModCapabilities;
    diagnosticsRootDirectory?: string;
    disabled?: boolean;
    globalModsDirectory?: string;
    includeGlobalMods?: boolean;
    registerCapabilitiesGlobally?: boolean;
    sessionId?: string | null;
    workingDirectory?: string | null;
}
export declare function createListenerModContext(options?: Pick<CreateListenerModAdapterOptions, "sessionId" | "workingDirectory"> & {
    agent?: {
        id: string;
        name?: string | null;
        model?: string | null;
        llm_config?: {
            model?: string | null;
            model_endpoint_type?: string | null;
            reasoning_effort?: string | null;
        } | null;
    } | null;
    modelIdentifier?: string | null;
    permissionMode?: string | null;
    toolset?: string | null;
}): ModContext;
export declare function createListenerAgentModContext(agentId: string): ModContext;
export declare function createListenerModAdapter(options?: CreateListenerModAdapterOptions): ModAdapter;
export declare function ensureListenerModAdapter(runtime: ListenerRuntime): ModAdapter;
export declare function ensureListenerAgentModAdapter(runtime: ListenerRuntime, agentId: string): Promise<ModAdapter | null>;
export declare function ensureListenerModAdaptersForAgent(runtime: ListenerRuntime, agentId: string): Promise<ModAdapter[]>;
export declare function getLoadedListenerModAdapters(runtime: ListenerRuntime, agentId?: string | null): ModAdapter[];
export declare function createListenerModEvents(adapters: ModAdapter[]): ModEvents;
export declare function reloadListenerModAdapter(runtime: ListenerRuntime, agentId?: string | null): Promise<void>;
export declare const __listenerModAdapterTestUtils: {
    setAgentModsDirectoryResolverForTests(resolver: (agentId: string) => string | null): void;
    setAgentModCacheDirectoryResolverForTests(resolver: (agentId: string) => string): void;
    setEnsureMemfsSyncedForAgentForTests(ensureSynced: typeof ensureMemfsSyncedForAgent): void;
    resetForTests(): void;
};
export declare function disposeListenerModAdapter(runtime: ListenerRuntime): void;
//# sourceMappingURL=mod-adapter.d.ts.map