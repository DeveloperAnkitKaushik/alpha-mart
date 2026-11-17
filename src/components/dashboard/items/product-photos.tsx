"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { move, removeAt } from "./draft-store";
import { ImageField } from "./image-field";

const MAX_IMAGES = 8;

const roundBtn = "grid size-8 place-items-center rounded-full bg-white/90 shadow disabled:opacity-30";

// Ordered product photos; the first is the cover. New photos are appended as each upload finishes.
export function ProductPhotos({ images, onChange }: { images: string[]; onChange: (update: (images: string[]) => string[]) => void }) {
  const left = MAX_IMAGES - images.length;
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold tracking-wide text-navy-deep uppercase">
        Photos · {images.length}/{MAX_IMAGES} · first one is the cover
      </legend>
      {images.length > 0 && (
        <ol className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <li key={`${i}-${src}`} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white ring-1 ring-border">
              <Image src={src} alt={`Photo ${i + 1}`} fill unoptimized sizes="160px" className="object-contain p-1" />
              {i === 0 && <span className="absolute top-1 left-1 rounded bg-navy px-1.5 text-[10px] font-bold text-white">COVER</span>}
              <span className="absolute inset-x-1 bottom-1 flex justify-between">
                <span className="flex gap-1">
                  <button type="button" aria-label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => onChange((list) => move(list, i, -1))} className={`${roundBtn} text-navy`}>
                    <ArrowLeft className="size-4" />
                  </button>
                  <button type="button" aria-label={`Move photo ${i + 1} later`} disabled={i === images.length - 1} onClick={() => onChange((list) => move(list, i, 1))} className={`${roundBtn} text-navy`}>
                    <ArrowRight className="size-4" />
                  </button>
                </span>
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange((list) => removeAt(list, i))} className={`${roundBtn} text-destructive`}>
                  <X className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
      {left > 0 ? (
        <ImageField
          label="Product photo"
          maxFiles={left}
          // Appends through the updater so photos finishing one after another don't overwrite each other.
          onChange={(src) => onChange((list) => (list.length < MAX_IMAGES ? [...list, src] : list))}
        />
      ) : (
        <p className="text-sm text-muted-foreground">8 photos is the limit. Remove one to add another.</p>
      )}
    </fieldset>
  );
}
