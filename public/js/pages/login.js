import { state, emit, go } from "../state.js";
import { api } from "../api.js";
import { t } from "../i18n.js";
import { html, mount, icon, $, $$, toast } from "../ui.js";

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, pw.length < 8 ? 0 : s - 1);
}

export async function render(root, { query }) {
  const next = query.get("next") || "me";
  let mode = query.get("mode") === "signup" ? "signup" : "login";
  let created = null; // { email } right after a successful sign-up
  if (state.user) {
    go(next);
    return;
  }

  const draw = () => {
    mount(
      root,
      html`<div class="auth-wrap">
        <aside class="auth-side">
          <div class="dots" style="width:420px;height:300px;right:-80px;top:40px;opacity:.35"></div>
          <div style="position:relative">
            <span class="crumbs" style="background:color-mix(in srgb,#fff 12%,transparent);border-color:transparent;color:var(--on-brown)">${icon("users")}<b style="color:#fff">${t("auth.sideKicker")}</b></span>
            <h2>${t("auth.sideA")}<br /><span class="soft">${t("auth.sideB")}</span></h2>
            <ul>${["side1", "side2", "side3", "side4"].map((k, i) => html`<li><span class="i">${icon(["flag", "vote", "trophy", "lock"][i])}</span><span>${t(`auth.${k}`)}</span></li>`)}</ul>
          </div>
          <div class="small" style="position:relative;opacity:.85">${t("footer.disclaimer")}</div>
        </aside>
        <div class="auth-main">
          <div class="auth-card">
            <div class="tabs" role="tablist">
              <button role="tab" aria-selected="${mode === "login"}" data-mode="login">${t("auth.tabLogin")}</button>
              <button role="tab" aria-selected="${mode === "signup"}" data-mode="signup">${t("auth.tabSignup")}</button>
            </div>
            <h1>${mode === "login" ? t("auth.welcome") : t("auth.create")}</h1>
            ${created && mode === "login" ? html`<div class="form-ok auth-created" role="status">${icon("check")}<span><b>${t("auth.createdTitle")}</b> ${t("auth.created")}</span></div>` : ""}
            <form class="stack lg" id="auth-form" novalidate>
              ${mode === "signup"
                ? html`<div class="field"><label for="a-name">${t("auth.name")}</label><input class="input" id="a-name" autocomplete="nickname" required minlength="2" maxlength="40" /><span class="hint">${t("auth.nameHint")}</span></div>`
                : ""}
              <div class="field"><label for="a-email">${t("auth.email")}</label><input class="input" id="a-email" type="email" autocomplete="email" required maxlength="120" /></div>
              <div class="field"><label for="a-pw">${t("auth.password")}</label>
                <div class="pw-wrap"><input class="input" id="a-pw" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" required minlength="8" maxlength="128" /><button type="button" id="pw-eye" aria-label="Show password">${icon("eye")}</button></div>
                ${mode === "signup" ? html`<div class="meter" aria-hidden="true"><i id="pw-meter" style="width:0"></i></div><span class="hint" id="pw-hint">${t("auth.pwHint")}</span>` : ""}
              </div>
              ${mode === "signup"
                ? html`<div class="grid grid-2" style="gap:12px">
                    <div class="field"><label for="a-role">${t("auth.role")}</label><select class="select" id="a-role">${["student", "investor", "senior", "other"].map((r) => html`<option value="${r}">${t(`role.${r}`)}</option>`)}</select></div>
                    <div class="field"><label for="a-college">${t("auth.college")}</label><input class="input" id="a-college" maxlength="80" autocomplete="organization" /></div>
                  </div>
                  <label class="check"><input type="checkbox" id="a-age" /> <span>${t("auth.age")}<br /><span class="xs muted">${t("auth.ageHint")}</span></span></label>
                  <label class="check"><input type="checkbox" id="a-consent" /> <span>${t("auth.consent")} <a href="#/privacy" target="_blank">${t("footer.privacy")}</a></span></label>
                  <label class="check"><input type="checkbox" id="a-board" checked /> <span>${t("auth.board")}</span></label>`
                : ""}
              <div id="a-msg" role="alert"></div>
              <button class="btn btn-primary btn-lg btn-block" type="submit" id="a-submit">${mode === "login" ? t("auth.loginBtn") : t("auth.signupBtn")}</button>
              <p class="auth-switch small">${mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")} <button type="button" class="link-btn" data-mode="${mode === "login" ? "signup" : "login"}">${mode === "login" ? t("auth.createLink") : t("auth.tabLogin")}</button></p>
              <a class="btn btn-ghost btn-block" href="#/dost">${t("auth.guest")} ${icon("arrowRight")}</a>
            </form>
          </div>
        </div>
      </div>`,
    );

    $$("[data-mode]", root).forEach((b) =>
      b.addEventListener("click", () => {
        mode = b.dataset.mode;
        created = null;
        draw();
      }),
    );
    $("#pw-eye", root).addEventListener("click", () => {
      const pw = $("#a-pw", root);
      pw.type = pw.type === "password" ? "text" : "password";
      mount($("#pw-eye", root), icon(pw.type === "password" ? "eye" : "eyeOff"));
    });
    if (mode === "signup") {
      $("#a-pw", root).addEventListener("input", (e) => {
        const s = strength(e.target.value);
        const meter = $("#pw-meter", root);
        meter.style.width = `${(e.target.value ? s + 1 : 0) * 20}%`;
        meter.style.background = ["var(--risk-high)", "var(--risk-high)", "var(--risk-medium)", "var(--risk-low)", "var(--risk-low)"][s];
        $("#pw-hint", root).textContent = e.target.value ? t("auth.strength")[s] : t("auth.pwHint");
      });
    }
    if (created && mode === "login") {
      $("#a-email", root).value = created.email;
      $("#a-pw", root).focus();
    } else $("#a-email", root).focus();

    $("#auth-form", root).addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#a-msg", root);
      const btn = $("#a-submit", root);
      btn.disabled = true;
      mount(msg, "");
      try {
        const body = { email: $("#a-email", root).value.trim(), password: $("#a-pw", root).value };
        if (mode === "signup") {
          // Create the account, then the person signs in with it.
          await api.post("/api/auth/signup", {
            ...body,
            name: $("#a-name", root).value.trim(),
            role: $("#a-role", root).value,
            college: $("#a-college", root).value.trim(),
            ageOk: $("#a-age", root).checked,
            consent: $("#a-consent", root).checked,
            leaderboard: $("#a-board", root).checked,
          });
          created = { email: body.email };
          mode = "login";
          draw();
          return;
        }
        const out = await api.post("/api/auth/login", body);
        state.user = out.user;
        emit("fs:auth");
        toast(state.lang === "hi" ? `स्वागत है, ${out.user.name}!` : `Welcome, ${out.user.name}!`);
        go(next);
      } catch (err) {
        mount(msg, html`<div class="form-error">${err.message}</div>`);
      } finally {
        btn.disabled = false;
      }
    });
  };
  draw();
}
