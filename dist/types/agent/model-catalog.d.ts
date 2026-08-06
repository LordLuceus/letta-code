/**
 * The static model catalog (models.json) and pure handle resolution.
 *
 * Split from `model.ts` so the catalog can be bundled into the browser-safe
 * `@letta-ai/letta-code/agent-presets` package export without dragging in
 * provider/backend modules. CLI code should keep importing from
 * `@/agent/model`, which re-exports this module.
 */
/**
 * A curated model catalog entry in the bundled models.json shape.
 *
 * The same shape is produced by the cloud catalog endpoint
 * (GET /v1/models/catalog, mapped in `@/agent/remote-model-catalog`), so the
 * bundled snapshot and live remote data are interchangeable.
 */
export interface CatalogModel {
    id: string;
    handle: string;
    label: string;
    description: string;
    shortLabel?: string;
    isDefault?: boolean;
    isFeatured?: boolean;
    free?: boolean;
    updateArgs?: Record<string, unknown>;
}
/**
 * The live model catalog. Seeded from the bundled models.json snapshot at
 * module load; on cloud (API) backends the array contents are refreshed in
 * place from GET /v1/models/catalog (see `@/agent/remote-model-catalog`), so
 * consumers that read at call time pick up live data without going async.
 * Do not capture long-lived copies of the array contents.
 */
export declare const models: CatalogModel[];
/**
 * Browser-safe presentation metadata for a curated Letta Code model preset.
 *
 * This is deliberately not an availability contract: connected providers,
 * local/custom models, and organization-specific hosted inventory remain
 * runtime concerns. Consumers may use presets for labels, descriptions,
 * ordering, and known settings while live API/device inventory decides what
 * is actually selectable.
 */
export interface ModelPreset {
    readonly id: string;
    readonly handle: string;
    readonly label: string;
    readonly description: string;
    readonly shortLabel?: string;
    readonly isDefault?: boolean;
    readonly isFeatured?: boolean;
    readonly free?: boolean;
    readonly updateArgs?: Readonly<Record<string, unknown>>;
}
/**
 * Curated model presentation presets bundled with Letta Code.
 *
 * Runtime model inventory is authoritative for availability. This export is
 * a readonly view over the same catalog used by the CLI's model resolver.
 */
export declare const MODEL_PRESETS: readonly ModelPreset[];
/**
 * Resolve a model by ID or handle
 * @param modelIdentifier - Can be either a model ID (e.g., "opus-4.5") or a full handle (e.g., "anthropic/claude-opus-4-5")
 * @returns The model handle if found, null otherwise
 */
export declare function resolveModel(modelIdentifier: string): string | null;
/**
 * Get the default model handle
 */
export declare function getDefaultModel(): string;
//# sourceMappingURL=model-catalog.d.ts.map