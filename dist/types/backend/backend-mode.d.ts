export type BackendMode = "api" | "local";
/**
 * Resolve the active backend mode: an explicit runtime override if one was set,
 * otherwise the experimental local-backend env flag.
 */
export declare function resolveBackendMode(): BackendMode;
/**
 * Set the active backend mode override. Callers that also need to swap the live
 * backend instance should use `configureBackendMode` from `@/backend` instead.
 */
export declare function setConfiguredBackendMode(mode: BackendMode): void;
export declare function isExperimentalLocalBackendEnabled(): boolean;
//# sourceMappingURL=backend-mode.d.ts.map