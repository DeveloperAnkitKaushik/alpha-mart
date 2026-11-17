import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "./firebase";
import { imageSrc } from "./site-content";

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
// Firestore caps a document at 1 MiB; base64 adds a third, so the encoded image must stay under ~700 KB.
const MAX_ENCODED = 950_000;
const ATTEMPTS = [
  { width: 1920, quality: 0.82 },
  { width: 1600, quality: 0.72 },
  { width: 1280, quality: 0.62 },
];

type Encoded = { data: string; type: "image/webp" | "image/jpeg" };

function encode(bitmap: ImageBitmap, width: number, quality: number, type: Encoded["type"]): Promise<Blob> {
  const scale = Math.min(1, width / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process this image."))), type, quality));
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Couldn't read this image."));
    reader.readAsDataURL(blob);
  });

// Safari can't encode WebP and silently returns PNG, so retry as JPEG and record the real type.
async function compress(bitmap: ImageBitmap, width: number, quality: number): Promise<Encoded> {
  let blob = await encode(bitmap, width, quality, "image/webp");
  if (blob.type !== "image/webp") blob = await encode(bitmap, width, quality, "image/jpeg");
  if (blob.type !== "image/webp" && blob.type !== "image/jpeg") throw new Error("This browser can't compress images. Try Chrome.");
  return { data: await toBase64(blob), type: blob.type };
}

// Compresses to WebP (JPEG on Safari) in the browser and stores it in Firestore; returns the path that serves it.
export async function uploadImage(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type)) throw new Error("Use a PNG, JPG, WebP, GIF or AVIF image.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That image is over 15 MB. Pick a smaller one.");
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("Your session expired. Sign in again.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This file isn't a readable image.");
  }
  try {
    for (const { width, quality } of ATTEMPTS) {
      const { data, type } = await compress(bitmap, width, quality);
      if (data.length > MAX_ENCODED) continue;
      const ref = await addDoc(collection(getDb(), "images"), { data, type, by: uid, createdAt: serverTimestamp() });
      return `/api/img/${ref.id}`;
    }
  } finally {
    bitmap.close();
  }
  throw new Error("This image has too much detail to store. Try a smaller or simpler one.");
}

// Confirms a link is an https URL (or site path) that the browser can actually decode as an image.
export async function checkImageUrl(raw: string): Promise<string> {
  const parsed = imageSrc.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Enter a valid image link.");
  const src = parsed.data;
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error("The link took too long to load.")), 10_000);
    img.onload = () => {
      clearTimeout(timer);
      if (img.naturalWidth > 0) resolve();
      else reject(new Error("That link isn't an image."));
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("That link isn't an image, or the site blocks sharing it."));
    };
    img.src = src;
  });
  return src;
}
