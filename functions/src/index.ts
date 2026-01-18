import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { sampleStates } from "./render/sample";
import { renderStates } from "./render/renderGif";
import { storeGif } from "./render/storeGif";
import { RenderState } from "./render/types";

initializeApp();

type RenderRequest = {
  states: RenderState[];
};

export const render = functions
  .region("us-central1")
  .runWith({ memory: "1GB", timeoutSeconds: 120 })
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    const bucketName = functions.config().render?.bucket || undefined;

    try {
      if (req.method === "GET") {
        const gif = await renderStates(sampleStates());
        const stored = await storeGif(gif, bucketName);
        res.status(200).json(stored);
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({ error: "method not allowed" });
        return;
      }

      const payload = req.body as RenderRequest;
      if (!payload?.states?.length) {
        res.status(400).json({ error: "missing states" });
        return;
      }

      const gif = await renderStates(payload.states);
      const stored = await storeGif(gif, bucketName);
      res.status(200).json(stored);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "render failed" });
    }
  });
