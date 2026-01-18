import type { NextApiRequest, NextApiResponse } from "next";
import { renderStates } from "../../server/render/renderGif";
import { sampleStates } from "../../server/render/sample";
import type { RenderState } from "../../server/render/types";

type RenderRequest = {
  states: RenderState[];
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const gif = await renderStates(sampleStates());
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.send(gif);
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const payload = req.body as RenderRequest;
    if (!payload?.states?.length) {
      res.status(400).json({ error: "missing states" });
      return;
    }
    const gif = await renderStates(payload.states);
    res.setHeader("Content-Type", "image/gif");
    res.send(gif);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "render failed" });
  }
}
