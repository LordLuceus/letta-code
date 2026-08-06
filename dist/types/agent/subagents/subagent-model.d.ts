import { type BackendMode } from "../../backend";
export declare function getModelHandleFromAgent(agent: {
    model?: string | null;
    model_settings?: {
        provider_type?: unknown;
    } | null;
    llm_config?: {
        model_endpoint_type?: string | null;
        model?: string | null;
    };
}): string | null;
export declare function getPrimaryAgentModelHandle(scope?: {
    agentId?: string | null;
    conversationId?: string | null;
}): Promise<{
    handle: string | null;
    agent: {
        model?: string | null;
        name?: string | null;
        model_settings?: {
            provider_type?: unknown;
        } | null;
        llm_config?: {
            model_endpoint_type?: string | null;
            model?: string | null;
        };
    } | null;
}>;
export declare function getCurrentBillingTier(): Promise<string | null>;
export declare function resolveSubagentModel(options: {
    userModel?: string;
    recommendedModel?: string;
    recommendedModelSource?: "builtin" | "user";
    parentModelHandle?: string | null;
    billingTier?: string | null;
    availableHandles?: Set<string>;
    subagentType?: string;
    backendMode?: BackendMode;
}): Promise<string | null>;
//# sourceMappingURL=subagent-model.d.ts.map