"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
const functions = __importStar(require("firebase-functions"));
const app_1 = require("firebase-admin/app");
const sample_1 = require("./render/sample");
const renderGif_1 = require("./render/renderGif");
const storeGif_1 = require("./render/storeGif");
(0, app_1.initializeApp)();
exports.render = functions
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
            const gif = await (0, renderGif_1.renderStates)((0, sample_1.sampleStates)());
            const stored = await (0, storeGif_1.storeGif)(gif, bucketName);
            res.status(200).json(stored);
            return;
        }
        if (req.method !== "POST") {
            res.status(405).json({ error: "method not allowed" });
            return;
        }
        const payload = req.body;
        if (!payload?.states?.length) {
            res.status(400).json({ error: "missing states" });
            return;
        }
        const gif = await (0, renderGif_1.renderStates)(payload.states);
        const stored = await (0, storeGif_1.storeGif)(gif, bucketName);
        res.status(200).json(stored);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "render failed" });
    }
});
