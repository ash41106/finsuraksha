import express from "express";
import { runAssistant } from "../assistant.js";
import { str, oneOf, parseImage, HttpError, asyncRoute } from "../validate.js";
import { CHAT_LANGS } from "../constants.js";

export function dostRoutes({ store, cfg, ai, limit }) {
  const r = express.Router();

  r.post(
    "/analyze",
    limit("dost", 40, 10 * 60_000),
    asyncRoute(async (req, res) => {
      const b = req.body || {};
      const message = str(b.message, { field: "Message", max: 6000 });
      const lang = oneOf(b.lang || "en", CHAT_LANGS, "language");
      let image = null;
      if (b.image) {
        if (!ai.vision) throw new HttpError(400, "Screenshot reading by AI is not available. The text read from your screenshot on this device was used instead.");
        if (b.imageConsent !== true) throw new HttpError(400, "Please confirm you want the AI to read the screenshot.");
        const img = parseImage(b.image);
        image = { mediaType: img.mediaType, data: img.data };
      }
      if (!message && !image) throw new HttpError(400, "Type or paste something to check.");
      const history = Array.isArray(b.history)
        ? b.history.slice(-8).map((h) => ({ role: h?.role === "assistant" ? "assistant" : "user", text: typeof h?.text === "string" ? h.text.slice(0, 2000) : "" }))
        : [];
      // Nothing from this request is stored - only anonymous counters are updated.
      const result = await runAssistant({ message, history, lang, image, store, cfg, ai });
      res.json(result);
    }),
  );

  return r;
}
