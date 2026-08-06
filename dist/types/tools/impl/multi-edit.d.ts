interface Edit {
    old_string: string;
    new_string: string;
    replace_all?: boolean;
}
export interface MultiEditArgs {
    file_path: string;
    edits: Edit[];
}
interface EditWithLine {
    description: string;
    startLine: number;
}
interface MultiEditResult {
    message: string;
    edits_applied: number;
    edits: EditWithLine[];
}
export declare function multi_edit(args: MultiEditArgs): Promise<MultiEditResult>;
export {};
//# sourceMappingURL=multi-edit.d.ts.map