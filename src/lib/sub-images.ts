// slug -> open-licence photos in public/subcategories (attribution in photo-credits.json, shown on /credits).
// Tiles and products fall back to icons for slugs not listed here.
export const SUB_IMAGES: Record<string, string[]> = {
  "adhesive": ["/subcategories/adhesive.jpg", "/subcategories/adhesive~0.jpg"],
  "basmati-rice": ["/subcategories/basmati-rice.jpg", "/subcategories/basmati-rice~0.jpg", "/subcategories/basmati-rice~1.jpg"],
  "bp-monitor": ["/subcategories/bp-monitor.jpg", "/subcategories/bp-monitor~0.jpg"],
  "cashew-nuts": ["/subcategories/cashew-nuts.jpg", "/subcategories/cashew-nuts~0.jpg", "/subcategories/cashew-nuts~1.jpg"],
  "caustic-soda": ["/subcategories/caustic-soda.jpg", "/subcategories/caustic-soda~0.jpg"],
  "cctv-camera": ["/subcategories/cctv-camera.jpg", "/subcategories/cctv-camera~0.jpg", "/subcategories/cctv-camera~1.jpg"],
  "ceramic-tiles": ["/subcategories/ceramic-tiles~0.jpg", "/subcategories/ceramic-tiles~1.jpg"],
  "cnc-machine": ["/subcategories/cnc-machine.jpg", "/subcategories/cnc-machine~0.jpg", "/subcategories/cnc-machine~1.jpg", "/subcategories/cnc-machine~2.jpg"],
  "corrugated-box": ["/subcategories/corrugated-box.jpg", "/subcategories/corrugated-box~0.jpg", "/subcategories/corrugated-box~1.jpg", "/subcategories/corrugated-box~2.jpg"],
  "cotton-t-shirt": ["/subcategories/cotton-t-shirt.jpg", "/subcategories/cotton-t-shirt~0.jpg"],
  "denim-jeans": ["/subcategories/denim-jeans.jpg", "/subcategories/denim-jeans~0.jpg", "/subcategories/denim-jeans~1.jpg", "/subcategories/denim-jeans~2.jpg"],
  "dye": ["/subcategories/dye~0.jpg"],
  "edible-oil": ["/subcategories/edible-oil.jpg", "/subcategories/edible-oil~0.jpg"],
  "fertilizer": ["/subcategories/fertilizer.jpg"],
  "glass-bottle": ["/subcategories/glass-bottle.jpg", "/subcategories/glass-bottle~0.jpg", "/subcategories/glass-bottle~1.jpg"],
  "hospital-bed": ["/subcategories/hospital-bed.jpg"],
  "hydraulic-press": ["/subcategories/hydraulic-press~0.jpg", "/subcategories/hydraulic-press~1.jpg"],
  "industrial-boiler": ["/subcategories/industrial-boiler.jpg", "/subcategories/industrial-boiler~0.jpg"],
  "industrial-solvent": ["/subcategories/industrial-solvent.jpg", "/subcategories/industrial-solvent~0.jpg"],
  "lathe-machine": ["/subcategories/lathe-machine.jpg", "/subcategories/lathe-machine~0.jpg", "/subcategories/lathe-machine~1.jpg", "/subcategories/lathe-machine~2.jpg"],
  "lithium-battery": ["/subcategories/lithium-battery.jpg", "/subcategories/lithium-battery~0.jpg", "/subcategories/lithium-battery~1.jpg", "/subcategories/lithium-battery~2.jpg"],
  "n95-mask": ["/subcategories/n95-mask~0.jpg", "/subcategories/n95-mask~1.jpg", "/subcategories/n95-mask~2.jpg"],
  "paper-bag": ["/subcategories/paper-bag.jpg", "/subcategories/paper-bag~0.jpg", "/subcategories/paper-bag~1.jpg"],
  "paver-blocks": ["/subcategories/paver-blocks.jpg"],
  "pigment": ["/subcategories/pigment.jpg", "/subcategories/pigment~0.jpg"],
  "pouch": ["/subcategories/pouch.jpg", "/subcategories/pouch~0.jpg"],
  "power-adapter": ["/subcategories/power-adapter.jpg", "/subcategories/power-adapter~0.jpg", "/subcategories/power-adapter~1.jpg", "/subcategories/power-adapter~2.jpg"],
  "red-chilli": ["/subcategories/red-chilli.jpg", "/subcategories/red-chilli~0.jpg", "/subcategories/red-chilli~1.jpg"],
  "silk-saree": ["/subcategories/silk-saree~0.jpg"],
  "smart-meter": ["/subcategories/smart-meter.jpg", "/subcategories/smart-meter~0.jpg", "/subcategories/smart-meter~1.jpg", "/subcategories/smart-meter~2.jpg"],
  "solar-inverter": ["/subcategories/solar-inverter.jpg", "/subcategories/solar-inverter~0.jpg", "/subcategories/solar-inverter~1.jpg"],
  "stretch-film": ["/subcategories/stretch-film.jpg"],
  "surgical-gloves": ["/subcategories/surgical-gloves.jpg"],
  "syringe": ["/subcategories/syringe.jpg", "/subcategories/syringe~0.jpg"],
  "tea": ["/subcategories/tea~0.jpg", "/subcategories/tea~1.jpg"],
  "tmt-bars": ["/subcategories/tmt-bars~0.jpg", "/subcategories/tmt-bars~1.jpg"],
  "turmeric": ["/subcategories/turmeric.jpg", "/subcategories/turmeric~0.jpg"],
  "uniform": ["/subcategories/uniform~0.jpg", "/subcategories/uniform~1.jpg", "/subcategories/uniform~2.jpg"],
  "welding-machine": ["/subcategories/welding-machine.jpg", "/subcategories/welding-machine~0.jpg", "/subcategories/welding-machine~1.jpg", "/subcategories/welding-machine~2.jpg"],
};

export function productPhoto(id: string, subcategory?: string): string | undefined {
  const photos = subcategory ? SUB_IMAGES[subcategory] : undefined;
  if (!photos) return undefined;
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return photos[h % photos.length];
}
