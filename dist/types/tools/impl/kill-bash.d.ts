interface KillBashArgs {
    shell_id: string;
}
interface KillBashResult {
    killed: boolean;
}
export declare function kill_bash(args: KillBashArgs): Promise<KillBashResult>;
export {};
//# sourceMappingURL=kill-bash.d.ts.map