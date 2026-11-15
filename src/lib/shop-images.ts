import type { ShopImageKey } from "@/lib/shop-data";

// key -> open-licence photos in public/shop (credits in photo-credits.json, shown on /credits). Items fall back to an icon when empty.
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
