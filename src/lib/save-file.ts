/**
 * Save a Blob letting the user pick the destination folder.
 * Uses the File System Access API (`showSaveFilePicker`) when available
 * (Chrome, Edge, Opera) and falls back to the classic download flow
 * (Firefox, Safari, in-app webviews) so the file always reaches the user.
 */

type SaveOptions = {
  suggestedName: string;
  mimeType: string;
  extension: string; // e.g. "epub", "docx", "pdf" — without the dot
  description?: string; // dialog label, e.g. "EPUB Book"
};

// Minimal typing for the File System Access API to avoid TS friction.
type FilePickerAcceptType = { description?: string; accept: Record<string, string[]> };
type ShowSaveFilePickerOptions = {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
};
type FileSystemWritableFileStream = {
  write: (data: Blob | BufferSource | string) => Promise<void>;
  close: () => Promise<void>;
};
type FileSystemFileHandle = {
  createWritable: () => Promise<FileSystemWritableFileStream>;
};
type WindowWithPicker = Window & {
  showSaveFilePicker?: (opts?: ShowSaveFilePickerOptions) => Promise<FileSystemFileHandle>;
};

function withExt(name: string, ext: string): string {
  const lower = name.toLowerCase();
  const dotted = `.${ext.toLowerCase()}`;
  return lower.endsWith(dotted) ? name : `${name}${dotted}`;
}

function fallbackDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Slight delay so the browser can pick the blob up before revoke.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * @returns `true` if the file was saved (or downloaded), `false` if the user
 *   explicitly cancelled the save dialog.
 */
export async function saveBlobAs(blob: Blob, opts: SaveOptions): Promise<boolean> {
  const filename = withExt(opts.suggestedName, opts.extension);
  // Direct download to browser's default Downloads folder — no dialog.
  fallbackDownload(blob, filename);
  return true;
}
