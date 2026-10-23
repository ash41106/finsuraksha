// On-device media helpers: image re-encoding (strips EXIF/GPS), OCR with
// tesseract.js, QR decoding with jsQR, and the Web Speech API (voice in/out).
const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const JSQR_URL = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";

const loaded = new Map();
function loadScript(src) {
  if (!loaded.has(src)) {
    loaded.set(
      src,
      new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.crossOrigin = "anonymous";
        s.onload = resolve;
        s.onerror = () => {
          loaded.delete(src);
          reject(new Error(`Could not load ${src}`));
        };
        document.head.appendChild(s);
      }),
    );
  }
  return loaded.get(src);
}

// Decode a File into a canvas, downscaled; re-encoding as JPEG drops EXIF/GPS metadata.
export async function prepareImage(file, maxSide = 1600) {
  if (!file || !/^image\//.test(file.type)) throw new Error("Please choose an image file.");
  if (file.size > 15 * 1024 * 1024) throw new Error("That image is too large (max 15 MB).");
  const bitmap = await createImageBitmap(file).catch(() => null);
  let w;
  let h;
  let draw;
  if (bitmap) {
    w = bitmap.width;
    h = bitmap.height;
    draw = (ctx, cw, ch) => ctx.drawImage(bitmap, 0, 0, cw, ch);
  } else {
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    w = img.naturalWidth;
    h = img.naturalHeight;
    draw = (ctx, cw, ch) => ctx.drawImage(img, 0, 0, cw, ch);
    URL.revokeObjectURL(url);
  }
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  draw(ctx, canvas.width, canvas.height);
  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > 2_400_000 && quality > 0.4) {
    quality -= 0.15;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return { canvas, dataUrl };
}

export async function readText(canvas, langs = "eng", onProgress) {
  await loadScript(TESSERACT_URL);
  const result = await window.Tesseract.recognize(canvas, langs, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) onProgress(m.progress);
    },
  });
  return (result?.data?.text || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function decodeQr(canvas) {
  await loadScript(JSQR_URL);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const tryDecode = (c) => {
    const data = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
    return window.jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
  };
  let found = tryDecode(canvas);
  if (!found && Math.max(canvas.width, canvas.height) > 800) {
    // Retry on a smaller copy - jsQR is more reliable at moderate sizes.
    const small = document.createElement("canvas");
    const s = 800 / Math.max(canvas.width, canvas.height);
    small.width = Math.round(canvas.width * s);
    small.height = Math.round(canvas.height * s);
    small.getContext("2d").drawImage(canvas, 0, 0, small.width, small.height);
    found = tryDecode(small);
  }
  void ctx;
  return found?.data || null;
}

export function parseUpiUri(text) {
  if (!text || !/^upi:\/\/pay\?/i.test(text.trim())) return null;
  try {
    const q = new URLSearchParams(text.trim().replace(/^upi:\/\/pay\?/i, ""));
    return { pa: (q.get("pa") || "").toLowerCase(), pn: q.get("pn") || "", am: q.get("am") || "", tn: q.get("tn") || "" };
  } catch {
    return null;
  }
}

// ---- Speech ------------------------------------------------------------
export const speechSupported = () => "speechSynthesis" in window;
export const recognitionSupported = () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

function voicesReady() {
  return new Promise((resolve) => {
    const v = speechSynthesis.getVoices();
    if (v.length) return resolve(v);
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });
}

// Returns { utterance, matched } - matched=false when no voice exists for the language.
export async function speak(text, lang = "en-IN", { onEnd } = {}) {
  if (!speechSupported() || !text) return { matched: false };
  speechSynthesis.cancel();
  const voices = await voicesReady();
  const base = lang.split("-")[0];
  const voice = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang?.startsWith(base)) || null;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  if (voice) u.voice = voice;
  u.rate = 0.95;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
  return { utterance: u, matched: Boolean(voice) };
}
export function stopSpeaking() {
  if (speechSupported()) speechSynthesis.cancel();
}

export function listen(lang, { onText, onEnd, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onError?.(new Error("unsupported"));
    return null;
  }
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let finalText = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    onText?.(finalText + interim);
  };
  rec.onerror = (e) => onError?.(e);
  rec.onend = () => onEnd?.(finalText);
  rec.start();
  return rec;
}
