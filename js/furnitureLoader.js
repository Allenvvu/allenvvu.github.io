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
    }
  }
  await Promise.all(loads);
  return sprites;
}
