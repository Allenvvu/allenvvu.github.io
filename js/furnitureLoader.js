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
        img.style.cssText = 'position:fixed;left:-9999px;top:-9999px;pointer-events:none';
        document.body.appendChild(img);
      }
    }
  }
  await Promise.all(loads);
  return sprites;
}
