// Generates the animated architecture diagrams used by the READMEs:
//   node docs/assets/build-diagram.mjs
// Output: architecture{,.pt-BR}-{light,dark}.svg next to this file.
// Pure SVG + CSS @keyframes (no JS, no web fonts); the animation stops under
// prefers-reduced-motion.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const W = 880;
const H = 548;
const DUR = 9; // seconds per loop

const THEMES = {
  light: {
    bg: "#f6f8fa",
    border: "#d0d7de",
    card: "#ffffff",
    text: "#1f2328",
    muted: "#59636e",
    zone: "#fbf6e9",
    zoneStroke: "#e7d6a6",
    zoneText: "#8a5a00",
    edge: "#818b98",
    accent: "#b45309",
  },
  dark: {
    bg: "#0d1117",
    border: "#30363d",
    card: "#161b22",
    text: "#e6edf3",
    muted: "#9198a1",
    zone: "#1c1a14",
    zoneStroke: "#4d4122",
    zoneText: "#e3b341",
    edge: "#6e7681",
    accent: "#e3b341",
  },
};

const COPY = {
  en: {
    lang: "en",
    title: "How barbearia-frontend works",
    desc:
      "Three kinds of users share one React single-page app. A customer books online through the public wizard at /, a barber follows the day's agenda at /barber, and a manager uses the dashboards under /manager. Every screen talks to the backend through one axios client that sends cookies and a CSRF header and, on a 401, refreshes the session once and retries. The REST API lives in a separate repository; when it pushes a server-sent event, the barber's agenda refreshes on its own. Built with VITE_DEMO=true, the same client talks to an in-memory API instead, which is how the GitHub Pages demo runs without a backend. The animation follows a booking from the customer to the barber's screen.",
    customer: ["customer", "books online"],
    barber: ["barber", "today's agenda"],
    manager: ["manager", "runs the shop"],
    spa: "React 19 SPA",
    spaStack: "SWR · Zustand · react-hook-form + zod",
    booking: ["/ · /confirm", "booking wizard"],
    barberRoute: ["/barber", "live agenda"],
    managerRoute: ["/manager/*", "finance · schedule · users"],
    axios: "axios client",
    axiosNote: "cookies + CSRF · 401 → refresh once → retry",
    api: "REST API",
    apiNote: "separate backend repository",
    demo: "VITE_DEMO=true",
    demoNote: "in-memory API · GitHub Pages",
    sse: "server-sent events",
  },
  pt: {
    lang: "pt-BR",
    title: "Como o barbearia-frontend funciona",
    desc:
      "Três tipos de usuário usam o mesmo app React de página única. O cliente agenda online pelo assistente público em /, o barbeiro acompanha a agenda do dia em /barber e o gerente usa os painéis em /manager. Toda tela fala com o backend por um único cliente axios, que envia cookies e o cabeçalho CSRF e, diante de um 401, renova a sessão uma vez e repete a chamada. A API REST fica em outro repositório; quando ela emite um server-sent event, a agenda do barbeiro se atualiza sozinha. Com VITE_DEMO=true, o mesmo cliente fala com uma API em memória, e é assim que a demo do GitHub Pages roda sem backend. A animação segue um agendamento do cliente até a tela do barbeiro.",
    customer: ["cliente", "agenda online"],
    barber: ["barbeiro", "agenda do dia"],
    manager: ["gerente", "gestão da loja"],
    spa: "SPA React 19",
    spaStack: "SWR · Zustand · react-hook-form + zod",
    booking: ["/ · /confirm", "assistente de agendamento"],
    barberRoute: ["/barber", "agenda ao vivo"],
    managerRoute: ["/manager/*", "financeiro · escala · usuários"],
    axios: "cliente axios",
    axiosNote: "cookies + CSRF · 401 → renova 1× → repete",
    api: "API REST",
    apiNote: "repositório de backend separado",
    demo: "VITE_DEMO=true",
    demoNote: "API em memória · GitHub Pages",
    sse: "server-sent events",
  },
};

// Card columns (x, width): customer, manager, barber. The barber sits on the
// right so the server-sent-events line can reach it along the edge.
const COLS = [
  { x: 44, w: 240 },
  { x: 320, w: 240 },
  { x: 596, w: 230 },
];
const cx = (i) => COLS[i].x + COLS[i].w / 2;

// Orthogonal polylines, as point lists. Order = animation order.
const HOPS = [
  { id: "book", pts: [[cx(0), 64], [cx(0), 140]] },
  { id: "call", pts: [[cx(0), 210], [cx(0), 282], [390, 282], [390, 320]] },
  { id: "api", pts: [[440, 390], [440, 440]] },
  { id: "sse", pts: [[630, 474], [862, 474], [862, 175], [826, 175]] },
];
// Static edges drawn under the animation.
const EDGES = [
  ...HOPS.filter((h) => h.id !== "sse"),
  { id: "manager", pts: [[cx(1), 64], [cx(1), 140]] },
  { id: "barber", pts: [[cx(2), 64], [cx(2), 140]] },
  { id: "m-ax", pts: [[cx(1), 210], [cx(1), 320]] },
  { id: "b-ax", pts: [[cx(2), 210], [cx(2), 282], [490, 282], [490, 320]] },
];

const d = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
const len = (pts) =>
  pts.slice(1).reduce((s, [x, y], i) => s + Math.hypot(x - pts[i][0], y - pts[i][1]), 0);

// Timeline: each hop gets a window proportional to its length, with pauses.
function timeline() {
  const gap = 0.03;
  const tail = 0.18; // rest at the end of the loop
  const total = HOPS.reduce((s, h) => s + len(h.pts), 0);
  const span = 1 - tail - gap * HOPS.length;
  let t = 0.02;
  return HOPS.map((h) => {
    const start = t;
    const end = start + (len(h.pts) / total) * span;
    t = end + gap;
    return { ...h, start, end };
  });
}

const pct = (v) => `${(v * 100).toFixed(2)}%`;

function packetKeyframes(hop) {
  const L = len(hop.pts);
  const frames = [`0%,${pct(hop.start)}{transform:translate(${hop.pts[0][0]}px,${hop.pts[0][1]}px);opacity:0}`];
  frames.push(`${pct(hop.start + 0.005)}{opacity:1}`);
  let acc = 0;
  hop.pts.slice(1).forEach(([x, y], i) => {
    acc += Math.hypot(x - hop.pts[i][0], y - hop.pts[i][1]);
    const at = hop.start + (acc / L) * (hop.end - hop.start);
    frames.push(`${pct(at)}{transform:translate(${x}px,${y}px);opacity:1}`);
  });
  const [lx, ly] = hop.pts.at(-1);
  frames.push(`${pct(Math.min(hop.end + 0.02, 0.99))},100%{transform:translate(${lx}px,${ly}px);opacity:0}`);
  return `@keyframes pk-${hop.id}{${frames.join("")}}`;
}

function glowKeyframes(hop) {
  return `@keyframes hl-${hop.id}{0%,${pct(hop.start)}{opacity:0}${pct(hop.start + 0.01)},${pct(hop.end)}{opacity:.9}${pct(Math.min(hop.end + 0.06, 0.995))},100%{opacity:0}}`;
}

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function svg(copy, theme) {
  const c = THEMES[theme];
  const hops = timeline();
  const font =
    'ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif';
  const mono =
    'ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace';

  const pill = (i, [name, note]) => {
    const w = 190;
    const x = cx(i) - w / 2;
    return `<rect x="${x}" y="20" width="${w}" height="44" rx="22" class="card"/>
<text x="${cx(i)}" y="47" text-anchor="middle"><tspan class="b">${esc(name)}</tspan><tspan class="m" dx="8">${esc(note)}</tspan></text>`;
  };
  const route = (i, [path, note]) => `<rect x="${COLS[i].x}" y="140" width="${COLS[i].w}" height="70" rx="10" class="card"/>
<text x="${cx(i)}" y="170" class="code" text-anchor="middle">${esc(path)}</text>
<text x="${cx(i)}" y="192" class="m" text-anchor="middle">${esc(note)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc" lang="${copy.lang}">
<title id="title">${esc(copy.title)}</title>
<desc id="desc">${esc(copy.desc)}</desc>
<style>
text{font-family:${font};fill:${c.text}}
.b{font-size:14px;font-weight:600}
.h{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;fill:${c.zoneText}}
.m{font-size:12.5px;fill:${c.muted}}
.code{font-family:${mono};font-size:13px}
.bg{fill:${c.bg};stroke:${c.border}}
.card{fill:${c.card};stroke:${c.border}}
.dash{fill:${c.card};stroke:${c.edge};stroke-dasharray:5 4}
.zone{fill:${c.zone};stroke:${c.zoneStroke}}
.e{fill:none;stroke:${c.edge};stroke-width:1.5;stroke-linejoin:round}
.ed{fill:none;stroke:${c.edge};stroke-width:1.5;stroke-dasharray:5 4}
.dot{fill:${c.accent}}
.halo{fill:${c.accent};opacity:.25}
.hl{fill:none;stroke:${c.accent};stroke-width:2.5;stroke-linejoin:round;opacity:0}
.pk{opacity:0}
${hops.map((h) => `.pk-${h.id}{animation:pk-${h.id} ${DUR}s linear infinite}.hl-${h.id}{animation:hl-${h.id} ${DUR}s linear infinite}`).join("\n")}
${hops.map(packetKeyframes).join("\n")}
${hops.map(glowKeyframes).join("\n")}
@media (prefers-reduced-motion:reduce){.pk,.hl{animation:none;display:none}}
</style>
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="${c.edge}"/></marker></defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" class="bg"/>
${pill(0, copy.customer)}
${pill(1, copy.manager)}
${pill(2, copy.barber)}
<rect x="24" y="96" width="822" height="134" rx="14" class="zone"/>
<text x="44" y="122" class="h">${esc(copy.spa)}</text>
<text x="${cx(0) + 14}" y="122" class="m">${esc(copy.spaStack)}</text>
${route(0, copy.booking)}
${route(1, copy.managerRoute)}
${route(2, copy.barberRoute)}
<rect x="250" y="320" width="380" height="70" rx="10" class="card"/>
<text x="440" y="350" class="b" text-anchor="middle">${esc(copy.axios)}</text>
<text x="440" y="372" class="m" text-anchor="middle">${esc(copy.axiosNote)}</text>
<rect x="250" y="440" width="380" height="70" rx="10" class="card"/>
<text x="440" y="470" class="b" text-anchor="middle">${esc(copy.api)}</text>
<text x="440" y="492" class="m" text-anchor="middle">${esc(copy.apiNote)}</text>
<rect x="24" y="440" width="200" height="70" rx="10" class="dash"/>
<text x="124" y="470" class="code" text-anchor="middle">${esc(copy.demo)}</text>
<text x="124" y="492" class="m" text-anchor="middle">${esc(copy.demoNote)}</text>
${EDGES.map((e) => `<path d="${d(e.pts)}" class="e" marker-end="url(#ah)"/>`).join("\n")}
<path d="M300,390 V415 H124 V440" class="ed" marker-end="url(#ah)"/>
<path d="${d(HOPS[3].pts)}" class="ed" marker-end="url(#ah)"/>
<text x="852" y="300" class="m" text-anchor="middle" transform="rotate(-90 852 300)">${esc(copy.sse)}</text>
${hops.map((h) => `<path d="${d(h.pts)}" class="hl hl-${h.id}"/>`).join("\n")}
${hops.map((h) => `<g class="pk pk-${h.id}"><circle r="9" class="halo"/><circle r="4.5" class="dot"/></g>`).join("\n")}
</svg>
`;
}

const here = dirname(fileURLToPath(import.meta.url));
for (const [key, copy] of Object.entries(COPY)) {
  for (const theme of Object.keys(THEMES)) {
    const suffix = key === "en" ? "" : ".pt-BR";
    const file = join(here, `architecture${suffix}-${theme}.svg`);
    writeFileSync(file, svg(copy, theme));
    console.log("wrote", file);
  }
}
