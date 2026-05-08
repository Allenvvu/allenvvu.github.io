import { loadCatalog, loadFurnitureSprites } from './furnitureLoader.js';
import { loadLayout, buildTileMap, buildBlockedTiles, buildFurnitureInstances } from './layoutStore.js';
import { createCharacter, updateCharacter } from './character.js';
import { renderFrame, computeZoom } from './renderer.js';
import { startGameLoop } from './gameLoop.js';
import { getWalkableTiles } from './tileMap.js';

async function main() {
  const canvas = document.getElementById('scene');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const [catalog, layout] = await Promise.all([loadCatalog(), loadLayout()]);

  const charImg = new Image();
  charImg.src = 'assets/Character Model.png';
  await new Promise(r => { charImg.onload = r; charImg.onerror = r; });

  const furnitureSprites = await loadFurnitureSprites(catalog);

  const tileMap = buildTileMap(layout);
  const blockedTiles = buildBlockedTiles(layout.furniture, catalog);
  const furnitureInstances = buildFurnitureInstances(layout.furniture, catalog, furnitureSprites);

  const zoom = computeZoom(canvas.width, canvas.height, layout.cols, layout.rows);

  const walkable = getWalkableTiles(tileMap, blockedTiles);
  const start = walkable.length > 0
    ? walkable[Math.floor(Math.random() * walkable.length)]
    : { col: 1, row: 1 };
  const character = createCharacter(start.col, start.row);

  startGameLoop(canvas, {
    update: (dt) => updateCharacter(character, dt, tileMap, blockedTiles),
    render: (ctx) => renderFrame(ctx, { cols: layout.cols, rows: layout.rows, tileMap }, furnitureInstances, character, charImg, zoom),
  });

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

main().catch(err => { console.error('Scene failed to start:', err); });
