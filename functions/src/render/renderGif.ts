import { readFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { RenderState } from "./types";

type AtlasName = "neutral" | "orange-star" | "blue-moon";

interface FrameMeta {
  frame: { x: number; y: number; w: number; h: number };
}

const SCALE = 2; // 16px sprites -> 32px
const spriteRoot = path.join(process.cwd(), "public", "img");

const atlasCache: Record<AtlasName, { image: sharp.Sharp; frames: Record<string, FrameMeta> }> =
  {} as any;
const tileCache = new Map<string, Buffer>();
const unitCache = new Map<string, Buffer>();

async function loadAtlas(name: AtlasName) {
  if (atlasCache[name]) return atlasCache[name];
  const image = sharp(path.join(spriteRoot, "spriteSheet", `${name}.png`));
  const frames = JSON.parse(
    readFileSync(path.join(spriteRoot, "spriteSheet", `${name}.json`), "utf8"),
  ).frames as Record<string, FrameMeta>;
  atlasCache[name] = { image, frames };
  return atlasCache[name];
}

async function getTileSprite(kind: "plain" | "city" | "hq", owner: "P1" | "P2" | null) {
  const cacheKey = `${kind}-${owner ?? "none"}`;
  const cached = tileCache.get(cacheKey);
  if (cached) return cached;

  let atlas: AtlasName = "neutral";
  let frame = "plain.png";
  if (kind === "city") {
    frame = "city-0.png";
  } else if (kind === "hq") {
    atlas = owner === "P1" ? "orange-star" : "blue-moon";
    frame = "hq-0.png";
  }
  const { image, frames } = await loadAtlas(atlas);
  const meta = frames[frame];
  if (!meta) throw new Error(`missing frame ${frame} in ${atlas}`);
  const buf = await image
    .clone()
    .extract({ left: meta.frame.x, top: meta.frame.y, width: meta.frame.w, height: meta.frame.h })
    .resize(meta.frame.w * SCALE, meta.frame.h * SCALE, { kernel: "nearest" })
    .png()
    .toBuffer();
  tileCache.set(cacheKey, buf);
  return buf;
}

async function getUnitSprite(owner: "P1" | "P2", kind: "Infantry" | "Tank") {
  const cacheKey = `${owner}-${kind}`;
  const cached = unitCache.get(cacheKey);
  if (cached) return cached;
  const faction = owner === "P1" ? "orangeStar" : "blueMoon";
  const filename = path.join(spriteRoot, "units", faction, `${kind}-0.png`);
  const buf = await sharp(filename)
    .resize(16 * SCALE, 16 * SCALE, { kernel: "nearest" })
    .png()
    .toBuffer();
  unitCache.set(cacheKey, buf);
  return buf;
}

export async function renderStates(states: RenderState[]) {
  const encoder = GIFEncoder();

  for (let idx = 0; idx < states.length; idx++) {
    const state = states[idx];
    const widthPx = state.width * 16 * SCALE;
    const heightPx = state.height * 16 * SCALE;

    const composites: sharp.OverlayOptions[] = [];

    for (let i = 0; i < state.tiles.length; i++) {
      const t = state.tiles[i];
      const x = (i % state.width) * 16 * SCALE;
      const y = Math.floor(i / state.width) * 16 * SCALE;
      const sprite =
        t.terrain === "plain"
          ? await getTileSprite("plain", null)
          : t.terrain === "city"
            ? await getTileSprite("city", t.owner)
            : await getTileSprite("hq", t.owner ?? "P1");
      composites.push({ input: sprite, left: x, top: y });
    }

    for (const u of state.units) {
      const sprite = await getUnitSprite(u.owner, u.kind);
      const x = u.pos.x * 16 * SCALE;
      const y = u.pos.y * 16 * SCALE;
      composites.push({ input: sprite, left: x, top: y });
    }

    const frameBuf = await sharp({
      create: {
        width: widthPx,
        height: heightPx,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composites)
      .raw()
      .toBuffer();

    const palette = quantize(frameBuf, 128);
    const indexData = applyPalette(frameBuf, palette);
    encoder.writeFrame(indexData, widthPx, heightPx, {
      palette,
      delay: 80,
      first: idx === 0,
    });
  }

  encoder.finish();
  return Buffer.from(encoder.bytes());
}
