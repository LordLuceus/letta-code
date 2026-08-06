import { type ModCapabilityId } from "./capabilities";
export declare const LETTA_PACKAGE_MANIFEST_VERSION = 1;
export type LettaPackageCapability = ModCapabilityId;
export interface LettaPackageEngines {
    lettaCodeCli?: string;
    lettaCodeDesktop?: string;
}
export interface LettaPackageManifest {
    manifestVersion: typeof LETTA_PACKAGE_MANIFEST_VERSION;
    mods: string[];
    capabilities?: LettaPackageCapability[];
    engines?: LettaPackageEngines;
}
export interface LettaPackageManifestValidationError {
    message: string;
    path: string;
}
export type LettaPackageManifestParseResult = {
    errors: [];
    manifest: LettaPackageManifest | null;
    ok: true;
} | {
    errors: LettaPackageManifestValidationError[];
    manifest: null;
    ok: false;
};
export declare function isSafeLettaPackageModEntryPath(value: string): boolean;
export declare function parseLettaPackageManifest(packageJson: unknown): LettaPackageManifestParseResult;
export declare function readLettaPackageManifest(packageJsonPath: string): LettaPackageManifestParseResult;
//# sourceMappingURL=package-manifest.d.ts.map