# Generated assets

Built-in image_gen used; no API key/CLI generation. PNG files are source copies. Runtime consumes optimized WebP. Characters max 640px; background 1280×853. Total WebP 931,282 bytes. Not all requested transparency was returned: skeleton/dragon retain a dark painted background, softened by CSS mask. Other characters have transparent cutouts.

## Exact shared prompt
Use case: stylized-concept. Production web game asset for One Minute Dungeon RE. Stylized 2D hand-painted dark fantasy, chunky ink outlines, chibi 3-head proportions, three-quarter view. Strong silhouette, midnight blue/teal shadows, warm amber upper-left lighting, cyan accents. Full body with generous margins, transparent background, no scenery, no text, no logos or watermark.

## Subject suffixes
- rogue: One hooded rogue, teal cloak, twin curved daggers, agile crouching stance, facing slightly right.
- mage: One mage in indigo robe and oversized pointed hat, glowing cyan staff, facing slightly right.
- goblin: One moss-green goblin scavenger, oversized rusty cleaver, leather armor and pointy ears, facing slightly left.
- skeleton: One ivory skeletal sentry with weathered round shield and long spear, teal cloth scraps, facing slightly left.
- dragon: One imposing ancient ember dragon boss, big spread wings and crownlike horns, charcoal scales, molten amber chest, much more formidable than chibi heroes, facing slightly left.
- dungeon: BACKGROUND EXCEPTION: no character, no transparency. Wide landscape 3:2 illustration of a ruined underground sanctuary, monumental cyan portal centered in distance, amber lanterns upper left, dark teal stone columns and foreground battle platform, luminous fog, painterly 2D fantasy. Clear playable foreground, no UI or text.

## Exact warrior prompt
Use case: stylized-concept. Create a production web game asset for One Minute Dungeon RE: one full-body chibi warrior guardian, silver plate armor, amber scarf, broad sword and round shield. Stylized 2D hand-painted dark fantasy, chunky ink outlines, 3-head-tall proportions, three-quarter view facing slightly right, strong silhouette readable small. Midnight blue/teal shadows, warm amber light from upper left and subtle cyan accents. Transparent background, generous empty margin around whole character, no scenery, no text or watermark. Save image for project use.

## Files
- `assets/warrior.png` → `assets/warrior.webp`
- `assets/rogue.png` → `assets/rogue.webp`
- `assets/mage.png` → `assets/mage.webp`
- `assets/goblin.png` → `assets/goblin.webp`
- `assets/skeleton.png` → `assets/skeleton.webp`
- `assets/dragon.png` → `assets/dragon.webp`
- `assets/dungeon.png` → `assets/dungeon.webp`

Re-optimize source PNGs: node tools/optimize-art.js. The original full-resolution generations are retained by image_gen outside the repository; project PNGs were downscaled for source size.
