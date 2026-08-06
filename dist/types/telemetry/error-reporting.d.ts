export type BoundaryErrorOptions = {
    context: string;
    errorType: string;
    error: unknown;
    httpStatus?: number;
    modelId?: string;
    runId?: string;
    recentChunks?: Record<string, unknown>[];
};
export declare function formatTelemetryErrorMessage(error: unknown): string;
export declare function trackBoundaryError(options: BoundaryErrorOptions): void;
//# sourceMappingURL=error-reporting.d.ts.map