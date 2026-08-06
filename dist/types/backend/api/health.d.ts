export interface ServerHealth {
    version?: string;
}
export declare function getServerHealth(options?: {
    baseUrl?: string;
    signal?: AbortSignal;
}): Promise<ServerHealth>;
//# sourceMappingURL=health.d.ts.map