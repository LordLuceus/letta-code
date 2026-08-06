export interface BalanceMetadata {
    total_balance: number;
    monthly_credit_balance: number;
    purchased_credit_balance: number;
    billing_tier: string;
}
export declare function getBalanceMetadata(): Promise<BalanceMetadata>;
export declare function getBillingTier(): Promise<string | null>;
export declare function submitFeedbackMetadata(apiKey: string | undefined, deviceId: string, payload: Record<string, unknown>): Promise<void>;
export declare function submitTelemetryMetadata(apiKey: string | undefined, deviceId: string, payload: Record<string, unknown>, options?: {
    signal?: AbortSignal;
}): Promise<void>;
//# sourceMappingURL=metadata.d.ts.map