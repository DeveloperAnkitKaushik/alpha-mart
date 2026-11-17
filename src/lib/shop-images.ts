export type ShopImageKey =
  | "laptop"
  | "desktop-pc"
  | "all-in-one-pc"
  | "macbook"
  | "gaming-laptop"
  | "thinkpad"
  | "dell-latitude"
  | "hp-elitebook";

// key -> open-licence photos in public/shop (credits in photo-credits.json, shown on /credits).
export const SHOP_IMAGES: Partial<Record<ShopImageKey, string[]>> = {
  "laptop": ["/shop/laptop-0.jpg", "/shop/laptop-1.jpg"],
  "desktop-pc": ["/shop/desktop-pc-0.jpg"],
  "all-in-one-pc": ["/shop/all-in-one-pc-0.jpg", "/shop/all-in-one-pc-1.jpg"],
  "macbook": ["/shop/macbook-0.jpg", "/shop/macbook-1.jpg"],
  "gaming-laptop": ["/shop/gaming-laptop-0.jpg", "/shop/gaming-laptop-1.jpg"],
  "thinkpad": ["/shop/thinkpad-0.jpg", "/shop/thinkpad-1.jpg"],
  "dell-latitude": ["/shop/dell-latitude-0.jpg"],
  "hp-elitebook": ["/shop/hp-elitebook-0.jpg"],
};

// Photos the admin can pick without uploading.
export const LIBRARY_IMAGES = [
  ...Object.values(SHOP_IMAGES).flat(),
  ...[1, 2, 3].flatMap((n) => [`/posters/banner-${n}-desktop.jpg`, `/posters/banner-${n}-mobile.jpg`]),
];
