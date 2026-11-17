"use client";

import Image from "next/image";
import { useId, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { ImagePlus, Images, Link2, Loader2, X } from "lucide-react";
import { checkImageUrl, uploadImage } from "@/lib/image-upload";
import { LIBRARY_IMAGES } from "@/lib/shop-images";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { inputClass } from "./fields";

type Busy = null | "upload" | "link";

// Pick an image by drag-and-drop, paste, file browse, an https link, or the built-in photo library.
// With `value` it shows the current image and replaces it; without, every pick is passed to onChange (add mode).
// `maxFiles` > 1 lets add mode take several files at once; they upload one after another.
export function ImageField({
  value,
  onChange,
  onClear,
  aspect = "aspect-[4/3]",
  label = "Image",
  maxFiles = 1,
}: {
  value?: string;
  onChange: (src: string) => void;
  onClear?: () => void;
  aspect?: string;
  label?: string;
  maxFiles?: number;
}) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const [link, setLink] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const run = async (kind: Exclude<Busy, null>, task: () => Promise<string>) => {
    setBusy(kind);
    setError("");
    try {
      onChange(await task());
      setLink("");
      setShowLibrary(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const applyLink = () => {
    if (link.trim() && !busy) void run("link", () => checkImageUrl(link.trim()));
  };
  const uploadMany = async (files: File[]) => {
    setBusy("upload");
    setError("");
    const failed: string[] = [];
    for (const [i, file] of files.entries()) {
      setProgress({ done: i, total: files.length });
      try {
        onChange(await uploadImage(file));
      } catch (e) {
        failed.push(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
    }
    if (failed.length) setError(`${failed.length} of ${files.length} didn't upload. ${failed.join(" · ")}`);
    setProgress(null);
    setBusy(null);
  };

  const takeFiles = (list: FileList | File[] | null | undefined) => {
    if (busy || !list) return;
    const files = [...list].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return setError("That isn't an image file.");
    const picked = files.slice(0, Math.max(1, maxFiles));
    if (picked.length === 1) return void run("upload", () => uploadImage(picked[0]));
    void uploadMany(picked);
    if (files.length > picked.length) toast.info(`Only the first ${picked.length} images were added — that's the limit.`);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    takeFiles(e.dataTransfer.files);
  };
  const onPaste = (e: ClipboardEvent) => {
    if (e.clipboardData.files.length) {
      e.preventDefault();
      takeFiles(e.clipboardData.files);
    }
  };

  return (
    <div className="space-y-2" onPaste={onPaste}>
      <div className="flex items-stretch gap-3">
        {value !== undefined && (
          <div className={cn("relative w-32 shrink-0 overflow-hidden rounded-xl bg-cream ring-1 ring-border", aspect)}>
            {value ? (
              <Image src={value} alt={`${label} preview`} fill unoptimized sizes="128px" className="object-contain" />
            ) : (
              <span className="grid size-full place-items-center text-xs text-muted-foreground">No image</span>
            )}
            {value && onClear && (
              <button type="button" aria-label={`Remove ${label.toLowerCase()}`} onClick={onClear} className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-white/90 text-destructive shadow">
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          disabled={busy !== null}
          aria-describedby={`${id}-hint`}
          className={cn(
            "flex min-h-24 flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-3 text-center text-sm transition",
            over ? "border-ember bg-peach/40" : "border-border bg-cream/50 hover:border-navy/40 hover:bg-cream",
          )}
        >
          {busy === "upload" ? <Loader2 className="size-5 animate-spin text-navy" /> : <ImagePlus className="size-5 text-navy" />}
          <span className="font-bold text-navy">{busy === "upload" ? (progress ? `Uploading ${progress.done + 1} of ${progress.total}…` : "Uploading…") : value ? "Drop to replace, or browse" : maxFiles > 1 ? "Drop images, or browse" : "Drop an image, or browse"}</span>
          <span id={`${id}-hint`} className="text-xs text-muted-foreground">
            PNG, JPG, WebP up to 15 MB{maxFiles > 1 ? ` · up to ${maxFiles} at once` : ""} · you can also paste
          </span>
        </button>
        <input ref={fileInput} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label={`Upload ${label.toLowerCase()}`} multiple={maxFiles > 1}
          onChange={(e) => {
            takeFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Not a <form>: this field sits inside other forms. */}
      <div className="flex gap-2">
        <span className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
            placeholder="…or paste an image link (https://)"
            aria-label={`${label} link`}
            aria-invalid={error ? true : undefined}
            className={cn(inputClass, "pl-9")}
          />
        </span>
        <button type="button" onClick={applyLink} disabled={!link.trim() || busy !== null} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-navy px-4 text-sm font-bold text-white disabled:opacity-40">
          {busy === "link" && <Loader2 className="size-4 animate-spin" />} Use link
        </button>
        <button
          type="button"
          aria-label="Choose from photo library"
          aria-expanded={showLibrary}
          onClick={() => setShowLibrary((v) => !v)}
          className="grid size-11 place-items-center rounded-xl text-navy ring-1 ring-border hover:bg-cream"
        >
          <Images className="size-4" />
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      )}

      {showLibrary && (
        <ul className="grid grid-cols-4 gap-2 rounded-xl bg-cream/60 p-2 ring-1 ring-border sm:grid-cols-6">
          {LIBRARY_IMAGES.map((src) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => {
                  onChange(src);
                  setShowLibrary(false);
                }}
                aria-label={`Use ${src.split("/").pop()}`}
                className={cn("relative block aspect-square w-full overflow-hidden rounded-lg bg-white ring-2 transition hover:ring-navy", src === value ? "ring-ember" : "ring-transparent")}
              >
                <Image src={src} alt="" fill unoptimized sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
