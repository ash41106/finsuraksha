// Points, levels and badges for FinScam Hunter. Points reward *verified*
// contributions far more than raw submissions, so spam doesn't pay.

export const POINTS = {
  submit: 2,
  verified: 40,
  rejected: -5,
  vote: 1,
  voteAligned: 4,
  quizDaily: 5,
  learnModule: 2,
};

export const LEVELS = [
  { min: 0, name: "Rookie" },
  { min: 50, name: "Spotter" },
  { min: 150, name: "Hunter" },
  { min: 400, name: "Guardian" },
  { min: 1000, name: "Sentinel" },
];

export const CERT_RULE = { points: 150, verifiedReports: 1 };

export function levelFor(points) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) index = i;
  return { index, name: LEVELS[index].name, min: LEVELS[index].min, next: LEVELS[index + 1]?.min ?? null };
}

export const BADGES = {
  first_report: { icon: "🚩", name: "First Flag", desc: "Submitted your first scam report" },
  verified_hunter: { icon: "✅", name: "Verified Hunter", desc: "A report you filed was community-verified" },
  dabba_buster: { icon: "🧨", name: "Dabba Buster", desc: "Got a dabba-trading report verified" },
  telegram_tracker: { icon: "📡", name: "Telegram Tracker", desc: "Got a Telegram scam report verified" },
  finfluencer_checker: { icon: "🎙️", name: "Finfluencer Fact-Checker", desc: "Got an unregistered-finfluencer report verified" },
  app_sleuth: { icon: "📱", name: "App Sleuth", desc: "Got a fake trading-app report verified" },
  community_judge: { icon: "⚖️", name: "Community Judge", desc: "Cast 10 verification votes" },
  quiz_champ: { icon: "🏆", name: "Quiz Champ", desc: "Scored 100% in Spot-the-Scam" },
  scholar: { icon: "📚", name: "Scam Scholar", desc: "Completed every Learn module" },
  guardian: { icon: "🛡️", name: "Guardian", desc: "Reached 400 points" },
};

export function award(store, user, points, reason) {
  if (!user) return;
  user.points = Math.max(0, (user.points || 0) + points);
  user.pointsLog = [{ points, reason, at: new Date().toISOString() }, ...(user.pointsLog || [])].slice(0, 40);
  store.save();
}

export function grantBadges(store, user, learnModuleCount) {
  if (!user) return [];
  const have = new Set(user.badges || []);
  const mine = store.data.reports.filter((r) => r.reporterId === user.id);
  const verified = mine.filter((r) => r.status === "verified");
  const votes = store.data.votes.filter((v) => v.userId === user.id).length;
  const earned = [];
  const give = (id, cond) => {
    if (cond && !have.has(id)) {
      have.add(id);
      earned.push(id);
    }
  };
  give("first_report", mine.length >= 1);
  give("verified_hunter", verified.length >= 1);
  give("dabba_buster", verified.some((r) => r.category === "dabba"));
  give("telegram_tracker", verified.some((r) => r.platform === "telegram"));
  give("finfluencer_checker", verified.some((r) => r.category === "finfluencer"));
  give("app_sleuth", verified.some((r) => r.category === "fake_app"));
  give("community_judge", votes >= 10);
  give("quiz_champ", (user.quiz?.best || 0) >= 1);
  give("scholar", learnModuleCount && (user.learned || []).length >= learnModuleCount);
  give("guardian", (user.points || 0) >= 400);
  if (earned.length) {
    user.badges = [...have];
    store.save();
  }
  return earned;
}
