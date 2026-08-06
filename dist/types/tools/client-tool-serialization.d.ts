import { type ModelFacingToolForm } from "./model-facing-tool";
interface ClientToolShape {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}
interface BuiltInToolShape {
    modelForm: ModelFacingToolForm;
}
interface NamedToolShape extends ClientToolShape {
}
export declare function serializeClientTools(registry: ReadonlyMap<string, BuiltInToolShape>, externalTools: ReadonlyMap<string, NamedToolShape>, modTools: ReadonlyMap<string, NamedToolShape>, getServerToolName: (name: string) => string): ClientToolShape[];
export {};
//# sourceMappingURL=client-tool-serialization.d.ts.map