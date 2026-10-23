// Spot the Scam content checks: every highlighted phrase must appear word-for-word
// (on word boundaries) in its message, in both languages, or the game can't mark it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { QUIZ, drawRound } from "../public/js/quiz-data.js";
import { MODULES } from "../public/js/content.js";

const SKINS = ["whatsapp", "telegram", "sms", "instagram", "email", "upi", "call", "app", "web", "ad"];
const edge = (ch) => ch === undefined || /\s/.test(ch);

test("question bank is well-formed in English and Hindi", () => {
  const ids = new Set();
  const modules = new Set(MODULES.map((m) => m.id));
  for (const q of QUIZ) {
    assert.ok(!ids.has(q.id), `duplicate id ${q.id}`);
    ids.add(q.id);
    assert.ok(SKINS.includes(q.app), `${q.id}: unknown app ${q.app}`);
    if (q.module) assert.ok(modules.has(q.module), `${q.id}: unknown module ${q.module}`);
    assert.ok(q.marks.length >= 2 && q.marks.length <= 5, `${q.id}: 2-5 marks`);
    for (const lang of ["en", "hi"]) {
      for (const key of ["sender", "text", "why", "tip"]) assert.ok(q[key]?.[lang], `${q.id}: missing ${key}.${lang}`);
      const text = q.text[lang];
      const spans = [];
      for (const m of q.marks) {
        assert.ok(m.why?.[lang], `${q.id}: mark without why.${lang}`);
        const at = text.indexOf(m[lang]);
        assert.ok(at >= 0, `${q.id} [${lang}]: "${m[lang]}" not found in text`);
        assert.equal(text.indexOf(m[lang], at + 1), -1, `${q.id} [${lang}]: "${m[lang]}" appears twice`);
        assert.ok(edge(text[at - 1]) && edge(text[at + m[lang].length]), `${q.id} [${lang}]: "${m[lang]}" must start and end on a word boundary`);
        spans.push([at, at + m[lang].length]);
      }
      spans.sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < spans.length; i++) assert.ok(spans[i][0] >= spans[i - 1][1], `${q.id} [${lang}]: marks overlap`);
    }
  }
  assert.ok(QUIZ.filter((q) => q.scam).length >= 6 && QUIZ.filter((q) => !q.scam).length >= 4);
});

test("a round has 6 scams and 4 genuine messages, no repeats", () => {
  for (let i = 0; i < 20; i++) {
    const round = drawRound();
    assert.equal(round.length, 10);
    assert.equal(round.filter((q) => q.scam).length, 6);
    assert.equal(new Set(round.map((q) => q.id)).size, 10);
  }
});
