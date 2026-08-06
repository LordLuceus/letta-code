import type { LettaStreamingResponse } from "@letta-ai/letta-client/resources/agents/messages";
import type { StopReasonType } from "@letta-ai/letta-client/resources/runs/runs";
export interface ApprovalRequest {
    toolCallId: string;
    toolName: string;
    toolArgs: string;
    /**
     * Server-assigned id of the approval_request_message this tool call arrived
     * on. Client tool lifecycle emissions reuse this id instead of minting one
     * (LET-10608).
     */
    messageId?: string;
}
export interface ErrorInfo {
    message: string;
    error_type?: string;
    detail?: string;
    run_id?: string;
}
export interface ChunkProcessingResult {
    /** Whether this chunk should be output to the user */
    shouldOutput: boolean;
    /** If this is an error chunk, formatted error message */
    errorInfo?: ErrorInfo;
    /** If this chunk updated an approval, the current state */
    updatedApproval?: ApprovalRequest;
}
export declare class StreamProcessor {
    private readonly seenSeqIdThreshold;
    pendingApprovals: Map<string, ApprovalRequest>;
    runIds: Set<string>;
    lastRunId: string | null;
    lastSeqId: number | null;
    stopReason: StopReasonType | null;
    constructor(seenSeqIdThreshold?: number | null);
    processChunk(chunk: LettaStreamingResponse): ChunkProcessingResult;
    /**
     * Get accumulated approvals as array
     */
    getApprovals(): ApprovalRequest[];
}
//# sourceMappingURL=stream-processor.d.ts.map