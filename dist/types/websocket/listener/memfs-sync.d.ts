/**
 * Lazy memfs sync for listen mode.
 *
 * When the listener receives the first message for an agent, this module
 * checks whether the agent has the `git-memory-enabled` tag and, if so,
 * clones or pulls the memory repo so the Memory tool and $MEMORY_DIR work
 * correctly — mirroring what the local headless path does during bootstrap.
 */
import type { ListenerRuntime } from "./types";
/**
 * Ensure the memfs git repo is cloned/pulled for the given agent.
 *
 * No-ops if:
 * - The agent was already synced this session
 * - The agent doesn't have the `git-memory-enabled` tag
 *
 * Concurrent callers for the same agent coalesce onto a single in-flight
 * promise so turn ordering stays deterministic.
 *
 * Non-fatal: logs a warning and returns false on failure so source consumers
 * do not read a stale checkout.
 */
export declare function ensureMemfsSyncedForAgent(listener: ListenerRuntime, agentId: string): Promise<boolean>;
//# sourceMappingURL=memfs-sync.d.ts.map