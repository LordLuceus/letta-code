// Clipboard utilities for detecting and importing images from system clipboard
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, isAbsolute, join, resolve } from "node:path";
import { resizeImageIfNeeded } from "@/utils/image-resize";
import { allocateImage } from "./paste-registry";

// Whether to log clipboard reader failures to stderr. Quiet by default to
// keep the TUI uncluttered; set LETTA_CLIPBOARD_DEBUG=1 to surface why a
// paste did nothing (missing wl-paste, PowerShell unavailable, etc.)
const CLIPBOARD_DEBUG = process.env.LETTA_CLIPBOARD_DEBUG === "1";

function clipDebug(msg: string): void {
  if (CLIPBOARD_DEBUG) {
    // eslint-disable-next-line no-console
    console.error(`[clipboard] ${msg}`);
  }
}

/**
 * Result type for clipboard image import.
 * - placeholder: Successfully imported, contains [Image #N]
 * - error: Failed with an error message
 * - null: No image in clipboard
 */
export type ClipboardImageResult =
  | { placeholder: string; resized: boolean; width: number; height: number }
  | { error: string }
  | null;

/**
 * Copy text to system clipboard
 * Returns true if successful, false otherwise
 */
export function copyToClipboard(text: string): boolean {
  try {
    if (process.platform === "darwin") {
      execFileSync("pbcopy", [], { input: text, encoding: "utf8" });
      return true;
    } else if (process.platform === "win32") {
      execFileSync("clip", [], { input: text, encoding: "utf8" });
      return true;
    } else {
      // Linux - try xclip first, then xsel
      try {
        execFileSync("xclip", ["-selection", "clipboard"], {
          input: text,
          encoding: "utf8",
        });
        return true;
      } catch {
        try {
          execFileSync("xsel", ["--clipboard", "--input"], {
            input: text,
            encoding: "utf8",
          });
          return true;
        } catch {
          return false;
        }
      }
    }
  } catch {
    return false;
  }
}

const IMAGE_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
  ".avif",
]);

function countLines(text: string): number {
  return (text.match(/\r\n|\r|\n/g) || []).length + 1;
}

// Translate various image paste formats into [Image #N] placeholders
export function translatePasteForImages(paste: string): string {
  let s = paste || "";

  // 1) iTerm2 OSC 1337 inline file transfer: ESC ] 1337;File=...:BASE64 <BEL or ST>
  try {
    // Build regex via code points to avoid control chars in literal
    const ESC = "\u001B";
    const BEL = "\u0007";
    const ST = `${ESC}\\`; // ESC \
    const pattern = `${ESC}]1337;File=([^${BEL}${ESC}]*):([\\s\\S]*?)(?:${BEL}|${ST})`;
    const OSC = new RegExp(pattern, "g");
    s = s.replace(OSC, (_m, paramsStr: string, base64: string) => {
      const params: Record<string, string> = {};
      for (const seg of String(paramsStr || "").split(";")) {
        const [k, v] = seg.split("=");
        if (k && v)
          params[k.trim().toLowerCase()] = decodeURIComponent(v.trim());
      }
      const name = params.name || undefined;
      const mt = params.type || params.mime || "application/octet-stream";
      const id = allocateImage({ data: base64, mediaType: mt, filename: name });
      return `[Image #${id}]`;
    });
  } catch {}

  // 2) Data URL images
  try {
    const DATA_URL = /data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;
    s = s.replace(DATA_URL, (_m, subtype: string, b64: string) => {
      const mt = `image/${subtype}`;
      const id = allocateImage({ data: b64, mediaType: mt });
      return `[Image #${id}]`;
    });
  } catch {}

  // 3) Single image file path paste (including drag-and-drop from Finder/screenshot)
  try {
    const trimmed = s.trim();
    const singleLine = countLines(trimmed) <= 1;
    if (singleLine) {
      let filePath = trimmed;

      // Strip surrounding quotes and shell-escape characters that terminals
      // add when drag-dropping files (e.g. '/path/to/file.png' or path\ with\ spaces)
      filePath = filePath.replace(/^['"]|['"]$/g, "");
      filePath = filePath.replace(/\\(?=[ '()&])/g, "");

      if (/^file:\/\//i.test(filePath)) {
        try {
          // Decode file:// URL
          const u = new URL(filePath);
          filePath = decodeURIComponent(u.pathname);
          // On Windows, pathname starts with /C:/
          if (process.platform === "win32" && /^\/[A-Za-z]:\//.test(filePath)) {
            filePath = filePath.slice(1);
          }
        } catch {}
      }
      // If relative, resolve against CWD
      if (!isAbsolute(filePath)) filePath = resolve(process.cwd(), filePath);
      const ext = extname(filePath || "").toLowerCase();
      if (IMAGE_EXTS.has(ext)) {
        let buf: Buffer | null = null;
        try {
          const stat = statSync(filePath);
          if (stat.isFile()) buf = readFileSync(filePath);
        } catch {
          // File may not exist (e.g. macOS cleaned up temp screenshot)
        }

        // macOS screenshot temp files (TemporaryItems/NSIRD_screencaptureui_*)
        // may be cleaned up before we can read them. Fall back to reading the
        // image directly from the clipboard via NSPasteboard.
        let clipboardMediaType: string | null = null;
        if (
          !buf &&
          process.platform === "darwin" &&
          /TemporaryItems\/.*screencaptureui/i.test(filePath)
        ) {
          const clipResult = getClipboardImageToTempFileMac();
          if (clipResult) {
            try {
              buf = readFileSync(clipResult.tempPath);
              clipboardMediaType = UTI_TO_MEDIA_TYPE[clipResult.uti] || null;
              try {
                unlinkSync(clipResult.tempPath);
              } catch {}
            } catch {}
          }
        }

        if (buf && buf.length > 0) {
          const b64 = buf.toString("base64");
          const mt =
            clipboardMediaType ||
            (ext === ".png"
              ? "image/png"
              : ext === ".jpg" || ext === ".jpeg"
                ? "image/jpeg"
                : ext === ".gif"
                  ? "image/gif"
                  : ext === ".webp"
                    ? "image/webp"
                    : ext === ".bmp"
                      ? "image/bmp"
                      : ext === ".svg"
                        ? "image/svg+xml"
                        : ext === ".tif" || ext === ".tiff"
                          ? "image/tiff"
                          : ext === ".heic"
                            ? "image/heic"
                            : ext === ".heif"
                              ? "image/heif"
                              : ext === ".avif"
                                ? "image/avif"
                                : "application/octet-stream");
          const id = allocateImage({
            data: b64,
            mediaType: mt,
            filename: basename(filePath),
          });
          s = `[Image #${id}]`;
        }
      }
    }
  } catch {}

  return s;
}

/**
 * Read image from macOS clipboard to a temp file.
 * Returns the temp file path and UTI, or null if no image in clipboard.
 */
function getClipboardImageToTempFileMac(): {
  tempPath: string;
  uti: string;
} | null {
  if (process.platform !== "darwin") return null;

  const tempPath = join(tmpdir(), `letta-clipboard-${Date.now()}.bin`);

  try {
    // JXA script that writes clipboard image to temp file and returns UTI
    // This avoids stdout buffer limits for large images
    const jxa = `
      ObjC.import('AppKit');
      ObjC.import('Foundation');
      (function() {
        var pb = $.NSPasteboard.generalPasteboard;
        var types = ['public.png','public.jpeg','public.tiff','public.heic','public.heif','public.bmp','public.gif'];
        for (var i = 0; i < types.length; i++) {
          var t = types[i];
          var d = pb.dataForType(t);
          if (d && d.length > 0) {
            d.writeToFileAtomically($('${tempPath}'), true);
            return t;
          }
        }
        return '';
      })();
    `;

    const uti = execFileSync("osascript", ["-l", "JavaScript", "-e", jxa], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (!uti || !existsSync(tempPath)) return null;

    return { tempPath, uti };
  } catch {
    // Clean up temp file on error
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch {}
    }
    return null;
  }
}

const UTI_TO_MEDIA_TYPE: Record<string, string> = {
  "public.png": "image/png",
  "public.jpeg": "image/jpeg",
  "public.tiff": "image/tiff",
  "public.heic": "image/heic",
  "public.heif": "image/heif",
  "public.bmp": "image/bmp",
  "public.gif": "image/gif",
};

/**
 * Read image from Windows clipboard to a temp PNG file.
 *
 * Uses PowerShell + System.Windows.Forms.Clipboard.GetImage() to fetch
 * the bitmap and save it as PNG. PowerShell must run in single-thread
 * apartment mode (-Sta) for the Clipboard class to work.
 *
 * Returns null when:
 *   - we're not on Windows
 *   - no image is in the clipboard
 *   - PowerShell isn't available (rare on modern Windows)
 *   - the PowerShell script fails for any reason
 *
 * Always returns image/png because GDI+ saves the bitmap as PNG, regardless
 * of the original clipboard format (DIB, BMP, etc.).
 */
function getClipboardImageToTempFileWin32(): {
  tempPath: string;
  uti: string;
} | null {
  if (process.platform !== "win32") return null;

  const tempPath = join(tmpdir(), `letta-clipboard-${Date.now()}.png`);

  // PowerShell script: load Forms, check for image, save as PNG, print marker.
  // We write to a known temp path passed in via $env: so we don't have to
  // round-trip the path through stdout (avoiding quoting / encoding issues).
  const ps = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "Add-Type -AssemblyName System.Drawing",
    "if ([System.Windows.Forms.Clipboard]::ContainsImage()) {",
    "  $img = [System.Windows.Forms.Clipboard]::GetImage()",
    "  if ($img -ne $null) {",
    "    $img.Save($env:LETTA_CLIPBOARD_TEMP, [System.Drawing.Imaging.ImageFormat]::Png)",
    "    Write-Output 'OK'",
    "  } else { Write-Output 'NO_IMAGE' }",
    "} else { Write-Output 'NO_IMAGE' }",
  ].join("; ");

  try {
    const result = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-Sta", "-Command", ps],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        env: { ...process.env, LETTA_CLIPBOARD_TEMP: tempPath },
      },
    ).trim();

    if (result !== "OK") {
      clipDebug(`win32 PowerShell returned '${result}'`);
      // Clean up if PS wrote a partial file before failing
      if (existsSync(tempPath)) {
        try {
          unlinkSync(tempPath);
        } catch {}
      }
      return null;
    }

    if (!existsSync(tempPath)) {
      clipDebug("win32 PowerShell reported OK but no file was written");
      return null;
    }

    return { tempPath, uti: "public.png" };
  } catch (err) {
    clipDebug(
      `win32 PowerShell threw: ${err instanceof Error ? err.message : String(err)}`,
    );
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch {}
    }
    return null;
  }
}

/**
 * Read image from Linux clipboard to a temp PNG file.
 *
 * Tries Wayland (`wl-paste`) first, then X11 (`xclip`). Both tools must be
 * installed by the user; we don't bundle them. If neither is present (or
 * the clipboard contains no image), returns null silently.
 *
 * We request `image/png` explicitly so the tool will emit PNG if available.
 * If the clipboard only contains BMP (e.g. via WSLg) we'll silently miss it
 * — fixing WSL is out of scope for this patch.
 */
function getClipboardImageToTempFileLinux(): {
  tempPath: string;
  uti: string;
} | null {
  if (process.platform !== "linux") return null;

  const tempPath = join(tmpdir(), `letta-clipboard-${Date.now()}.png`);

  const tryTool = (cmd: string, args: string[]): boolean => {
    try {
      const buf = execFileSync(cmd, args, {
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 64 * 1024 * 1024, // 64MB; large screenshots can exceed default 1MB
      });
      if (!buf || buf.length === 0) return false;
      // execFileSync returns a Buffer when no encoding is set
      const out = buf as unknown as Buffer;
      // Quick sanity check on PNG magic bytes (89 50 4E 47)
      if (
        out.length < 8 ||
        out[0] !== 0x89 ||
        out[1] !== 0x50 ||
        out[2] !== 0x4e ||
        out[3] !== 0x47
      ) {
        return false;
      }
      writeFileSync(tempPath, out);
      return true;
    } catch (err) {
      clipDebug(
        `linux ${cmd} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  };

  // Wayland first (most modern distros)
  if (tryTool("wl-paste", ["--type", "image/png"])) {
    return { tempPath, uti: "public.png" };
  }

  // X11 fallback
  if (tryTool("xclip", ["-selection", "clipboard", "-t", "image/png", "-o"])) {
    return { tempPath, uti: "public.png" };
  }

  clipDebug("linux: neither wl-paste nor xclip produced a PNG");
  return null;
}

/**
 * Platform-dispatching clipboard image reader. Returns the temp file path
 * + UTI on success, or null when the clipboard had no image or the platform
 * has no available reader.
 */
function getClipboardImageToTempFileForPlatform(): {
  tempPath: string;
  uti: string;
} | null {
  if (process.platform === "darwin") return getClipboardImageToTempFileMac();
  if (process.platform === "win32") return getClipboardImageToTempFileWin32();
  if (process.platform === "linux") return getClipboardImageToTempFileLinux();
  return null;
}

/**
 * Import image from system clipboard, resize if needed, return placeholder.
 * Cross-platform: macOS uses NSPasteboard via osascript, Windows uses
 * PowerShell + Forms.Clipboard, Linux tries wl-paste then xclip.
 *
 * Resizes large images to fit within API limits (2000x2000).
 *
 * Returns:
 *   { placeholder, resized, width, height }  on successful paste
 *   { error }                                on read/decode failure
 *   null                                     when clipboard has no image
 *                                            or platform has no reader
 */
export async function tryImportClipboardImage(): Promise<ClipboardImageResult> {
  const clipboardResult = getClipboardImageToTempFileForPlatform();
  if (!clipboardResult) return null;

  const { tempPath, uti } = clipboardResult;

  try {
    // Read the temp file
    const buffer = readFileSync(tempPath);

    // Clean up temp file immediately after reading
    try {
      unlinkSync(tempPath);
    } catch {}

    const mediaType = UTI_TO_MEDIA_TYPE[uti] || "image/png";

    // Resize if needed (handles large retina screenshots, HEIC conversion, etc.)
    const resized = await resizeImageIfNeeded(buffer, mediaType);

    // Store in registry
    const id = allocateImage({
      data: resized.data,
      mediaType: resized.mediaType,
    });

    return {
      placeholder: `[Image #${id}]`,
      resized: resized.resized,
      width: resized.width,
      height: resized.height,
    };
  } catch (err) {
    // Clean up temp file on error
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch {}
    }

    const message = err instanceof Error ? err.message : String(err);
    return { error: `Image paste failed: ${message}` };
  }
}

/**
 * Back-compat alias for the previous Mac-only entry point.
 * New callers should use {@link tryImportClipboardImage}; this exists so any
 * external/embed code that imported the old name keeps working for now.
 */
export const tryImportClipboardImageMac = tryImportClipboardImage;
