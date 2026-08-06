import type { LocalAgentRecord } from "./local-types";
export interface LocalCompiledSystemPrompt {
    content: string;
    coreMemory: string;
    midConversationSystemPrompt?: string;
    compiledAt: string;
    rawSystemHash: string;
    memfsRevision?: string;
}
export interface CompileLocalSystemPromptOptions {
    agent: LocalAgentRecord;
    conversationId: string;
    memoryDir?: string;
    includeMemfs?: boolean;
    now?: Date;
    previousMessageCount?: number;
}
export declare function hashRawSystemPrompt(systemPrompt: string): string;
export declare function getCommittedMemfsRevision(memoryDir: string): string | undefined;
export declare function compileAvailableSkillsBlock(clientSkills?: unknown[]): string;
export declare function appendAvailableSkillsBlock(systemPrompt: string, clientSkills?: unknown[]): string;
export declare function compileLocalSystemPrompt(options: CompileLocalSystemPromptOptions): LocalCompiledSystemPrompt;
//# sourceMappingURL=system-prompt-compilation.d.ts.map