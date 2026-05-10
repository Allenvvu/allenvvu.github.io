export function loadFloorTile(name) {
  return new Promise(resolve => {
    if (!name) { resolve(null); return; }
    const img = new Image();
    img.src = `assets/floor/${name}.png`;
    img.onload = () => resolve(img);
    img.onerror = () => { console.warn(`Failed to load floor tile: ${name}`); resolve(null); };
  });
}

export async function loadAllFloorTiles() {
  const entries = [[1, 'wooden'], [2, 'white'], [3, 'gray']];
  const result = {};
  await Promise.all(entries.map(([tileVal, name]) =>
    loadFloorTile(name).then(img => { result[tileVal] = img; })
  ));
  return result;
}

export async function loadCatalog() {
  const res = await fetch('data/catalog.json');
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`);
  return res.json();
}

export async function loadFurnitureSprites(catalog) {
  const sprites = {};
  const loads = [];
  for (const item of catalog) {
    for (const variant of item.variants) {
      const img = new Image();
      img.src = variant.file;
      loads.push(new Promise(resolve => {
        img.onload = resolve;
        img.onerror = () => { console.warn(`Failed to load: ${variant.file}`); resolve(); };
      }));
      sprites[variant.id] = img;
      if (variant.file.endsWith('.gif')) {
        // Safari won't advance GIF frames for off-screen elements; keep it in the
        // viewport at near-zero opacity so the browser keeps compositing it.
        img.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-9999';
        document.body.appendChild(img);
      }
    }
  }
  await Promise.all(loads);
  return sprites;
}
