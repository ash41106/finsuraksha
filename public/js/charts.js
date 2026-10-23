// Small SVG chart kit following the dataviz rules: single-hue magnitude marks,
// 2px lines, <=24px bars with 4px rounded data ends, hairline solid gridlines,
// hover/focus tooltips, and a table view twin for every chart.
import { html, el, esc, raw, fmtNum } from "./ui.js";

const NS = "http://www.w3.org/2000/svg";
const niceMax = (v) => {
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

function tooltip(host) {
  let tip = host.querySelector(".chart-tip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.hidden = true;
    host.appendChild(tip);
  }
  return {
    show(x, y, value, label) {
      tip.textContent = "";
      const b = document.createElement("b");
      b.textContent = value;
      const s = document.createElement("span");
      s.textContent = label;
      tip.append(b, s);
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
      tip.hidden = false;
    },
    hide() {
      tip.hidden = true;
    },
  };
}

// Single-series line + area wash, crosshair snapping to the nearest point.
export function lineChart(host, points, { height = 150, onBrown = false, valueName = "" } = {}) {
  host.classList.add("chart");
  if (onBrown) host.classList.add("on-brown");
  const W = 320;
  const H = height;
  const m = { t: 18, r: 16, b: 24, l: 26 };
  const max = niceMax(Math.max(1, ...points.map((p) => p.value)));
  const x = (i) => m.l + (i * (W - m.l - m.r)) / Math.max(1, points.length - 1);
  const y = (v) => m.t + (1 - v / max) * (H - m.t - m.b);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const area = `${line}L${x(points.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const stroke = onBrown ? "var(--on-brown)" : "var(--brand)";
  const surface = onBrown ? "var(--brown-card)" : "var(--surface)";
  const ticks = [0, max / 2, max];
  const labelIdx = points.length <= 4 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const last = points.length - 1;
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(valueName)} trend, latest ${points[last]?.value ?? 0}">
    ${ticks.map((t) => `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-label" x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${fmtNum(t)}</text>`).join("")}
    <path d="${area}" fill="${stroke}" opacity="0.1"/>
    <path d="${line}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${labelIdx.map((i) => `<text class="axis-label" x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(points[i].short || points[i].label)}</text>`).join("")}
    <circle cx="${x(last)}" cy="${y(points[last]?.value || 0)}" r="4.5" fill="${stroke}" stroke="${surface}" stroke-width="2"/>
    <text class="value-label" x="${x(last)}" y="${y(points[last]?.value || 0) - 10}" text-anchor="end">${points[last]?.value ?? 0}</text>
    <line class="xhair" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="${stroke}" stroke-width="1" opacity="0" />
    <circle class="xdot" r="4.5" fill="${stroke}" stroke="${surface}" stroke-width="2" opacity="0"/>
    <rect class="hit" x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent" tabindex="0"/>
  </svg>`;
  host.insertAdjacentHTML("afterbegin", svg);
  const s = host.querySelector("svg");
  const tip = tooltip(host);
  const xh = s.querySelector(".xhair");
  const dot = s.querySelector(".xdot");
  const hit = s.querySelector(".hit");
  let cur = last;
  const showAt = (i) => {
    cur = i;
    const p = points[i];
    xh.setAttribute("x1", x(i));
    xh.setAttribute("x2", x(i));
    xh.setAttribute("opacity", "0.35");
    dot.setAttribute("cx", x(i));
    dot.setAttribute("cy", y(p.value));
    dot.setAttribute("opacity", "1");
    const scale = s.clientWidth / W;
    tip.show(x(i) * scale, y(p.value) * scale, String(p.value), `${valueName} · ${p.label}`);
  };
  const hide = () => {
    xh.setAttribute("opacity", "0");
    dot.setAttribute("opacity", "0");
    tip.hide();
  };
  hit.addEventListener("pointermove", (e) => {
    const r = s.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    showAt(best);
  });
  hit.addEventListener("pointerleave", hide);
  hit.addEventListener("focus", () => showAt(cur));
  hit.addEventListener("blur", hide);
  hit.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") showAt(Math.min(points.length - 1, cur + 1));
    if (e.key === "ArrowLeft") showAt(Math.max(0, cur - 1));
  });
}

// Single-series columns, value on the cap, per-bar tooltip.
export function columnChart(host, items, { height = 150, onBrown = false, valueName = "" } = {}) {
  host.classList.add("chart");
  if (onBrown) host.classList.add("on-brown");
  const W = 320;
  const H = height;
  const m = { t: 22, r: 6, b: 26, l: 6 };
  const max = Math.max(1, ...items.map((d) => d.value));
  const band = (W - m.l - m.r) / Math.max(1, items.length);
  const bw = Math.min(24, band * 0.56);
  const y = (v) => m.t + (1 - v / max) * (H - m.t - m.b);
  const fill = onBrown ? "var(--on-brown)" : "var(--brand)";
  const rr = 4;
  const bars = items
    .map((d, i) => {
      const cx = m.l + band * i + band / 2;
      const x0 = cx - bw / 2;
      const top = y(d.value);
      const base = H - m.b;
      const h = Math.max(0, base - top);
      const r = Math.min(rr, h, bw / 2);
      const path = h <= 0 ? "" : `M${x0},${base}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + bw - r}Q${x0 + bw},${top} ${x0 + bw},${top + r}V${base}Z`;
      return `<g class="bar" data-i="${i}" tabindex="0" role="img" aria-label="${esc(d.label)}: ${d.value}">
        <rect x="${cx - band / 2}" y="${m.t - 16}" width="${band}" height="${H - m.t + 16 - m.b}" fill="transparent"/>
        <path d="${path}" fill="${fill}"/>
        <text class="value-label" x="${cx}" y="${top - 6}" text-anchor="middle">${d.value}</text>
        <text class="axis-label" x="${cx}" y="${H - 8}" text-anchor="middle">${esc(d.short || d.label)}</text></g>`;
    })
    .join("");
  host.insertAdjacentHTML("afterbegin", `<svg viewBox="0 0 ${W} ${H}"><line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>${bars}</svg>`);
  const s = host.querySelector("svg");
  const tip = tooltip(host);
  s.querySelectorAll(".bar").forEach((g) => {
    const i = Number(g.dataset.i);
    const show = () => {
      const scale = s.clientWidth / W;
      const cx = m.l + band * i + band / 2;
      g.querySelector("path").style.opacity = "0.8";
      tip.show(cx * scale, y(items[i].value) * scale, String(items[i].value), `${items[i].label}${valueName ? ` · ${valueName}` : ""}`);
    };
    const hide = () => {
      g.querySelector("path").style.opacity = "";
      tip.hide();
    };
    g.addEventListener("pointerenter", show);
    g.addEventListener("pointerleave", hide);
    g.addEventListener("focus", show);
    g.addEventListener("blur", hide);
  });
}

// Horizontal bars (HTML) - label, bar with value at the tip.
export function barList(host, items, { onBrown = false, wide = false } = {}) {
  const max = Math.max(1, ...items.map((d) => d.value));
  host.classList.add("bar-list");
  if (onBrown) host.classList.add("on-brown");
  if (wide) host.classList.add("wide");
  host.innerHTML = items
    .map(
      (d) => `<div class="bar-row" title="${esc(d.label)}: ${d.value}">
        <span>${esc(d.label)}</span>
        <div class="track"><div class="fill" style="width:${Math.max(2, (d.value / max) * 100).toFixed(1)}%"></div></div>
        <span class="val">${d.value}</span></div>`,
    )
    .join("");
}

// Status-coloured segmented bar for risk levels (icon + label in the legend).
export function riskBar(segments) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const nonzero = segments.filter((x) => x.value > 0);
  return html`<div class="risk-bar" role="img" aria-label="${segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(", ")}">
      ${nonzero.map((s) => raw(`<span style="width:${((s.value / total) * 100).toFixed(1)}%;background:${s.color}" title="${esc(s.label)}: ${s.value}"></span>`))}
    </div>
    <div class="legend">
      ${segments.map((s) => html`<span class="li"><span class="sw" style="background:${s.color}"></span>${s.label} <b>${Math.round((s.value / total) * 100)}%</b></span>`)}
    </div>`;
}

// Wraps a chart with a title row and a Table/Chart toggle (accessible twin).
export function chartCard(container, { title, render, rows, columns, onBrown = false, toggleLabel = ["Table", "Chart"] }) {
  const node = el(html`<div>
    <div class="dc-head"><span>${title}</span><button class="mini-btn" type="button" aria-pressed="false">${toggleLabel[0]}</button></div>
    <div class="chart-holder"></div>
    <div class="table-holder hidden"><table class="chart-table"><thead><tr>${columns.map((c, i) => html`<th class="${i ? "num" : ""}">${c}</th>`)}</tr></thead>
      <tbody>${rows.map((r) => html`<tr>${r.map((v, i) => html`<td class="${i ? "num" : ""}">${v}</td>`)}</tr>`)}</tbody></table></div>
  </div>`);
  if (onBrown) node.querySelector(".table-holder").classList.add("on-brown");
  container.appendChild(node);
  render(node.querySelector(".chart-holder"));
  const btn = node.querySelector(".mini-btn");
  btn.addEventListener("click", () => {
    const showTable = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(showTable));
    btn.textContent = showTable ? toggleLabel[1] : toggleLabel[0];
    node.querySelector(".chart-holder").classList.toggle("hidden", showTable);
    node.querySelector(".table-holder").classList.toggle("hidden", !showTable);
  });
  return node;
}

export { NS };
