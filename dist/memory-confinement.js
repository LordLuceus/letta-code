// src/permissions/memory-confinement-launcher.ts
import { homedir as homedir3 } from "node:os";
import { basename as basename2, dirname as dirname2, join as join3, resolve as resolve2 } from "node:path";

// src/permissions/sandbox-policy.ts
import { existsSync, realpathSync } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { basename, dirname, isAbsolute, join as join2, resolve } from "node:path";

// src/sandbox/policy.ts
import { posix, win32 } from "node:path";
var SANDBOX_ENV_VAR = "LETTA_SANDBOX";
function buildFsSandboxPolicy(options) {
  return {
    baseWritableRoots: normalizeRoots(options.baseWritableRoots ?? []),
    deniedRoots: normalizeRoots(options.deniedRoots ?? []),
    readonlyRoots: normalizeRoots(options.readonlyRoots ?? []),
    writableRoots: normalizeRoots(options.writableRoots ?? []),
    restrictWrites: options.restrictWrites ?? false
  };
}
function normalizeSandboxPath(path) {
  const trimmed = path.trim();
  const absolute = posix.isAbsolute(trimmed) || win32.isAbsolute(trimmed) ? trimmed : posix.resolve("/", trimmed);
  const forward = absolute.replace(/\\/g, "/");
  return forward.replace(/\/+$/, "") || "/";
}
function normalizeRoots(roots) {
  const seen = new Set;
  for (const root of roots) {
    if (!root || !root.trim())
      continue;
    seen.add(normalizeSandboxPath(root));
  }
  return [...seen];
}

// src/utils/local-backend-paths.ts
import { homedir } from "node:os";
import { join } from "node:path";
var LOCAL_BACKEND_DIR_ENV = "LETTA_LOCAL_BACKEND_DIR";
function getLocalBackendStorageDir(homeDir = homedir(), env = process.env) {
  return env[LOCAL_BACKEND_DIR_ENV] ?? join(homeDir, ".letta", "lc-local-backend");
}
function getLocalBackendCrossAgentTreeRoot(storageDir = getLocalBackendStorageDir()) {
  return join(storageDir, "memfs");
}

// src/permissions/sandbox-policy.ts
function getDefaultAgentsTreeRoot(homeDir = homedir2()) {
  return canonicalizeRoot(join2(homeDir, ".letta", "agents"));
}
function getCrossBackendAgentsTreeRoots(options = {}) {
  const homeDir = options.homeDir ?? homedir2();
  const localBackendStorageDir = options.localBackendStorageDir ?? getLocalBackendStorageDir(homeDir, options.env ?? process.env);
  return [
    getDefaultAgentsTreeRoot(homeDir),
    canonicalizeRoot(getLocalBackendCrossAgentTreeRoot(localBackendStorageDir))
  ];
}
function getLettaHomeRoot(homeDir = homedir2()) {
  return canonicalizeRoot(join2(homeDir, ".letta"));
}
function canonicalizeRoot(input) {
  const abs = isAbsolute(input) ? input : resolve(input);
  let dir = abs;
  const tail = [];
  while (!existsSync(dir)) {
    tail.unshift(basename(dir));
    const parent = dirname(dir);
    if (parent === dir) {
      return normalizeSandboxPath(abs);
    }
    dir = parent;
  }
  try {
    const real = realpathSync(dir);
    return normalizeSandboxPath(tail.length ? join2(real, ...tail) : real);
  } catch {
    return normalizeSandboxPath(abs);
  }
}
function isWithinRoot(path, root) {
  return path === root || path.startsWith(`${root}/`);
}
function isAncestorOfRoot(path, root) {
  const prefix = path === "/" ? "/" : `${path}/`;
  return root.startsWith(prefix);
}
function isTreeOrAncestorOfTree(path, canonicalTrees) {
  return canonicalTrees.some((tree) => path === tree || isAncestorOfRoot(path, tree));
}
function resolveAgentsTreeRootsInput(roots) {
  return roots?.length ? roots.map(canonicalizeRoot) : getCrossBackendAgentsTreeRoots();
}
function deriveSelfAgentRootsForTrees(memoryRoots, agentsTreeRoots = getCrossBackendAgentsTreeRoots()) {
  const canonicalTrees = agentsTreeRoots.map(canonicalizeRoot);
  const out = new Set;
  for (const root of memoryRoots) {
    const canon = canonicalizeRoot(root);
    const containingTree = canonicalTrees.find((tree) => canon !== tree && isWithinRoot(canon, tree));
    if (containingTree) {
      const leaf = basename(canon);
      const parentLeaf = basename(dirname(canon));
      out.add(leaf === "memory" || leaf === "memory-worktrees" ? dirname(canon) : parentLeaf === "memory-worktrees" || parentLeaf === "memory" && leaf === ".git" ? dirname(dirname(canon)) : canon);
      continue;
    }
    if (!isTreeOrAncestorOfTree(canon, canonicalTrees)) {
      out.add(canon);
    }
  }
  return [...out];
}
function deriveWritableMemoryRootsForTrees(memoryRoots, agentsTreeRoots) {
  const canonicalTrees = agentsTreeRoots.map(canonicalizeRoot);
  const out = new Set;
  for (const root of memoryRoots) {
    const canon = canonicalizeRoot(root);
    if (!isTreeOrAncestorOfTree(canon, canonicalTrees)) {
      out.add(canon);
    }
  }
  return [...out];
}
function buildMemorySubagentSandboxPolicy(input) {
  const agentsTreeRoots = resolveAgentsTreeRootsInput(input.agentsTreeRoots);
  const baseWritableRoots = [
    getLettaHomeRoot(),
    ...input.harnessWritableRoots ?? []
  ].map(canonicalizeRoot);
  return buildFsSandboxPolicy({
    baseWritableRoots,
    deniedRoots: agentsTreeRoots,
    readonlyRoots: [
      ...deriveSelfAgentRootsForTrees(input.memoryRoots, agentsTreeRoots),
      ...(input.readonlyRoots ?? []).map(canonicalizeRoot)
    ],
    writableRoots: deriveWritableMemoryRootsForTrees(input.memoryRoots, agentsTreeRoots),
    restrictWrites: true
  });
}

// src/sandbox/bwrap.ts
var BWRAP_BIN = "bwrap";
function buildBwrapArgs(policy) {
  const args = [];
  args.push(policy.restrictWrites ? "--ro-bind" : "--bind", "/", "/");
  args.push("--dev", "/dev");
  args.push("--proc", "/proc");
  for (const root of policy.baseWritableRoots) {
    args.push("--bind-try", root, root);
  }
  for (const root of policy.deniedRoots) {
    args.push("--tmpfs", root);
  }
  for (const root of policy.readonlyRoots) {
    args.push("--ro-bind-try", root, root);
  }
  for (const root of policy.writableRoots) {
    args.push("--bind-try", root, root);
  }
  args.push("--die-with-parent");
  return args;
}

// src/sandbox/seatbelt.ts
var SANDBOX_EXEC_PATH = "/usr/bin/sandbox-exec";
function buildSeatbeltProfile(policy) {
  const defines = [];
  const lines = ["(version 1)", "(allow default)"];
  if (policy.restrictWrites) {
    lines.push('(deny file-write* (subpath "/"))');
    lines.push('(allow file-write* (subpath "/dev"))');
  }
  policy.baseWritableRoots.forEach((root, i) => {
    const name = `BASEWRITABLE_${i}`;
    defines.push({ name, value: root });
    lines.push(`(allow file-write* (subpath (param "${name}")))`);
  });
  policy.deniedRoots.forEach((root, i) => {
    const name = `DENIED_${i}`;
    defines.push({ name, value: root });
    lines.push(`(deny file-read* file-write* (subpath (param "${name}")))`);
    lines.push(`(allow file-read-metadata (literal (param "${name}")))`);
  });
  policy.writableRoots.forEach((root, i) => {
    const name = `WRITABLE_${i}`;
    defines.push({ name, value: root });
    lines.push(`(allow file-read* file-write* (subpath (param "${name}")))`);
  });
  policy.readonlyRoots.forEach((root, i) => {
    const name = `READONLY_${i}`;
    defines.push({ name, value: root });
    lines.push(`(allow file-read* (subpath (param "${name}")))`);
  });
  return { profile: `${lines.join(`
`)}
`, defines };
}
function buildSeatbeltArgs(policy) {
  const { profile, defines } = buildSeatbeltProfile(policy);
  const args = ["-p", profile];
  for (const { name, value } of defines) {
    args.push(`-D${name}=${value}`);
  }
  return args;
}

// src/sandbox/wrap.ts
function wrapLauncher(launcher, policy, options) {
  if (!options.backend)
    return null;
  if (launcher.length === 0)
    return null;
  switch (options.backend) {
    case "seatbelt":
      return [
        SANDBOX_EXEC_PATH,
        ...buildSeatbeltArgs(policy),
        "--",
        ...launcher
      ];
    case "bwrap":
      return [
        options.bwrapPath ?? BWRAP_BIN,
        ...buildBwrapArgs(policy),
        "--",
        ...launcher
      ];
  }
}

// src/permissions/memory-confinement-launcher.ts
function normalizeRoot(path) {
  const trimmed = path.trim();
  const expanded = trimmed.startsWith("~/") ? join3(homedir3(), trimmed.slice(2)) : trimmed.startsWith("$HOME/") ? join3(homedir3(), trimmed.slice(6)) : trimmed;
  return resolve2(expanded);
}
function resolveWritableMemoryRoots(env) {
  const roots = new Set;
  for (const value of [env.MEMORY_DIR, env.LETTA_MEMORY_DIR]) {
    if (!value?.trim())
      continue;
    const root = normalizeRoot(value);
    roots.add(root);
    if (basename2(root) === "memory") {
      roots.add(join3(dirname2(root), "memory-worktrees"));
    }
  }
  return [...roots];
}
function customHarnessWritableRoots(env) {
  return [env.LETTA_LOCAL_BACKEND_DIR, env.LETTA_TRANSCRIPT_ROOT].filter((value) => Boolean(value?.trim())).map(normalizeRoot);
}
function createMemoryConfinementLauncherWithAvailability(input, availability) {
  if (input.launcher.length === 0) {
    throw new Error("Memory confinement requires a non-empty launcher.");
  }
  const memoryRoots = resolveWritableMemoryRoots(input.env);
  if (memoryRoots.length === 0) {
    throw new Error("Memory confinement requires MEMORY_DIR or LETTA_MEMORY_DIR.");
  }
  if (!availability.backend) {
    throw new Error(`Memory confinement is unavailable: ${availability.reason}.`);
  }
  const localBackendStorageDir = input.env.LETTA_LOCAL_BACKEND_DIR?.trim() || undefined;
  const policy = buildMemorySubagentSandboxPolicy({
    memoryRoots,
    agentsTreeRoots: getCrossBackendAgentsTreeRoots({
      env: input.env,
      localBackendStorageDir
    }),
    harnessWritableRoots: customHarnessWritableRoots(input.env)
  });
  const launcher = wrapLauncher(input.launcher, policy, {
    backend: availability.backend,
    bwrapPath: availability.bwrapPath
  });
  if (!launcher) {
    throw new Error("Memory confinement could not wrap the launcher.");
  }
  return {
    launcher,
    env: { ...input.env, [SANDBOX_ENV_VAR]: availability.backend },
    backend: availability.backend
  };
}

// src/sandbox/availability.ts
import { spawnSync } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
import { delimiter, isAbsolute as isAbsolute2, join as join4 } from "node:path";
var cached = null;
var warnedUnavailableContexts = new Set;
function detectSandboxBackend(options = {}) {
  const platform = options.platform ?? process.platform;
  if (!options.force && cached && !options.platform) {
    return cached;
  }
  const result = probe(platform);
  if (!options.platform) {
    cached = result;
  }
  return result;
}
function probe(platform) {
  if (platform === "darwin") {
    if (existsSync2(SANDBOX_EXEC_PATH)) {
      return { backend: "seatbelt", reason: "sandbox-exec available" };
    }
    return {
      backend: null,
      reason: `${SANDBOX_EXEC_PATH} not found`
    };
  }
  if (platform === "linux") {
    return probeBwrap();
  }
  return {
    backend: null,
    reason: `no filesystem sandbox backend for platform "${platform}"`
  };
}
function probeBwrap() {
  const bwrapPath = resolveExecutableOnPath("bwrap");
  if (!bwrapPath) {
    return { backend: null, reason: "bwrap not found on PATH" };
  }
  const version = spawnSync(bwrapPath, ["--version"], { timeout: 5000 });
  if (version.error || version.status !== 0) {
    return { backend: null, reason: "bwrap not found on PATH" };
  }
  const userns = spawnSync(bwrapPath, ["--ro-bind", "/", "/", "--unshare-user", "/bin/true"], { timeout: 5000 });
  if (userns.error || userns.status !== 0) {
    return {
      backend: null,
      reason: "bwrap present but user namespaces are unavailable"
    };
  }
  return { backend: "bwrap", bwrapPath, reason: "bwrap available" };
}
function resolveExecutableOnPath(executable, envPath = process.env.PATH) {
  if (isAbsolute2(executable) && existsSync2(executable))
    return executable;
  for (const dir of (envPath ?? "").split(delimiter)) {
    if (!dir)
      continue;
    const candidate = join4(dir, executable);
    if (existsSync2(candidate))
      return candidate;
  }
  return null;
}

// src/memory-confinement.ts
function createMemoryConfinementLauncher(input) {
  return createMemoryConfinementLauncherWithAvailability(input, detectSandboxBackend());
}
export {
  createMemoryConfinementLauncher
};

//# debugId=AE23F92737D03FFB64756E2164756E21
