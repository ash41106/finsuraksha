import { state } from "../state.js";
import { t, L } from "../i18n.js";
import { html, mount, icon, $, $$, toast, copyText } from "../ui.js";
import { CHECKLIST, DIRECTORY } from "../content.js";

const KEY = "fs_checklist";

export async function render(root) {
  let done = [];
  try {
    done = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    /* none */
  }
  const hi = state.lang === "hi";
  mount(
    root,
    html`<section class="page-hero"><div class="blob b1"></div>
      <div class="container" style="position:relative;z-index:1">
        <span class="crumbs">${icon("help")}<b>${t("help.kicker")}</b></span>
        <h1 class="page-title">${t("help.titleA")} <span class="soft">${t("help.titleB")}</span></h1>
        <p class="lead">${t("help.lead")}</p>
      </div></section>
    <section class="container stack lg">
      <div class="emergency">
        <div><div class="small" style="opacity:.8">${t("help.emTitle")}</div><div class="num">1930</div><p style="margin:6px 0 0;max-width:520px">${t("help.emText")}</p></div>
        <div class="row"><a class="btn btn-light btn-lg" href="tel:1930">${icon("phone")}${t("help.call")}</a><a class="btn btn-on-brown btn-lg" href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">${t("help.file")} ${icon("external")}</a></div>
      </div>

      <div class="grid grid-2" style="align-items:start">
        <div class="card pad-lg">
          <h3 style="font-size:1.3rem;margin-bottom:14px">${icon("check")} ${t("help.checklist")}</h3>
          <ol class="checklist">${CHECKLIST.map((c, i) => html`<li><label><input type="checkbox" data-i="${i}" ${done.includes(i) ? "checked" : ""} /><span>${L(c)}</span></label></li>`)}</ol>
        </div>
        <div class="card pad-lg">
          <h3 style="font-size:1.3rem">${icon("book")} ${t("help.draft")}</h3>
          <p class="small muted">${t("help.draftText")}</p>
          <form class="stack" id="draft-form">
            <div class="field"><label for="d-what">${t("help.dWhat")}</label><textarea class="textarea" id="d-what" maxlength="2000" placeholder="${hi ? "जैसे: एक WhatsApp ग्रुप ने ऐप इंस्टॉल कराया और निकासी के लिए टैक्स माँगा…" : "e.g. A WhatsApp group made me install an app and then asked for tax to withdraw…"}"></textarea></div>
            <div class="grid grid-2" style="gap:12px">
              <div class="field"><label for="d-when">${t("help.dWhen")}</label><input class="input" type="date" id="d-when" /></div>
              <div class="field"><label for="d-amt">${t("help.dAmount")}</label><input class="input" id="d-amt" inputmode="decimal" placeholder="50000" /></div>
            </div>
            <div class="grid grid-2" style="gap:12px">
              <div class="field"><label for="d-mode">${t("help.dMode")}</label><select class="select" id="d-mode"><option>UPI</option><option>NEFT / IMPS / RTGS</option><option>Debit / credit card</option><option>Crypto / USDT</option><option>Cash</option><option>${hi ? "अन्य" : "Other"}</option></select></div>
              <div class="field"><label for="d-txn">${t("help.dTxn")}</label><input class="input" id="d-txn" maxlength="300" placeholder="UTR 4321…" /></div>
            </div>
            <div class="field"><label for="d-who">${t("help.dWho")}</label><textarea class="textarea" id="d-who" style="min-height:70px" maxlength="1000" placeholder="+91…, t.me/…, app name, UPI ID…"></textarea></div>
            <div><button class="btn btn-primary" type="submit">${t("help.dBuild")}</button></div>
          </form>
          <div id="draft-out"></div>
        </div>
      </div>

      <div class="notice danger">${icon("alert")}<div><b>${t("help.donts")}</b><div class="small" style="margin-top:4px">${t("help.dontsText")}</div></div></div>

      <div>
        <h2 class="h-section" style="font-size:clamp(1.6rem,3vw,2.2rem);margin-bottom:18px">${t("help.directory")}</h2>
        <div class="grid grid-3">${DIRECTORY.map((d) => html`<a class="dir-card" href="${d.url}" ${d.url.startsWith("http") ? html`target="_blank" rel="noopener noreferrer"` : ""}><span class="dh">${d.name}${icon(d.url.startsWith("tel:") ? "phone" : "external")}</span><p>${L(d.desc)}</p></a>`)}</div>
      </div>
    </section>`,
  );

  $$(".checklist input", root).forEach((c) =>
    c.addEventListener("change", () => {
      const i = Number(c.dataset.i);
      done = c.checked ? [...new Set([...done, i])] : done.filter((x) => x !== i);
      try {
        localStorage.setItem(KEY, JSON.stringify(done));
      } catch {
        /* per-visit only */
      }
    }),
  );

  $("#draft-form", root).addEventListener("submit", (e) => {
    e.preventDefault();
    const v = (id) => $(id, root).value.trim();
    const text = [
      hi ? "विषय: ऑनलाइन निवेश ठगी की शिकायत" : "Subject: Complaint about online investment fraud",
      "",
      hi ? "महोदय/महोदया," : "Sir/Madam,",
      "",
      hi ? "मैं निम्नलिखित ऑनलाइन निवेश ठगी की शिकायत दर्ज करना चाहता/चाहती हूँ:" : "I wish to report the following online investment fraud:",
      "",
      `${hi ? "क्या हुआ" : "What happened"}: ${v("#d-what") || "-"}`,
      `${hi ? "पहले संपर्क की तारीख़" : "Date of first contact"}: ${v("#d-when") || "-"}`,
      `${hi ? "गई रकम" : "Amount lost"}: ${v("#d-amt") ? `₹${v("#d-amt")}` : "-"}`,
      `${hi ? "भुगतान का तरीक़ा" : "Mode of payment"}: ${v("#d-mode")}`,
      `${hi ? "ट्रांज़ैक्शन / UTR ID" : "Transaction / UTR IDs"}: ${v("#d-txn") || "-"}`,
      `${hi ? "ठग की जानकारी (नंबर, हैंडल, लिंक, ऐप)" : "Fraudster details (numbers, handles, links, app)"}: ${v("#d-who") || "-"}`,
      "",
      hi ? "मेरे पास स्क्रीनशॉट और लेन-देन के सबूत हैं, जो माँगने पर दे सकता/सकती हूँ। कृपया लेन-देन रोकने और जाँच की कार्रवाई करें।" : "I have screenshots and transaction proofs that I can share on request. Please help freeze the money trail and investigate.",
      "",
      hi ? "धन्यवाद," : "Thank you,",
      hi ? "[आपका नाम, मोबाइल नंबर]" : "[Your name, mobile number]",
    ].join("\n");
    mount(
      $("#draft-out", root),
      html`<pre class="draft" style="margin-top:14px">${text}</pre>
      <div class="row" style="margin-top:10px"><button class="btn btn-primary btn-sm" id="d-copy">${icon("copy")}${t("common.copy")}</button><button class="btn btn-outline btn-sm" id="d-print">${icon("print")}${t("help.dPrint")}</button>
      <a class="btn btn-ghost btn-sm" href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in ${icon("external")}</a></div>`,
    );
    $("#d-copy", root).addEventListener("click", async () => {
      if (await copyText(text)) toast(t("common.copied"));
    });
    $("#d-print", root).addEventListener("click", () => window.print());
  });
}
