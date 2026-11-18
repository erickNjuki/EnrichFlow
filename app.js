/* ============ EnrichFlow — GTM data workbench ============ */
"use strict";

/* ---------- utilities ---------- */
const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hash = (s) => {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

/* ---------- mock data pools ---------- */
const INDUSTRIES = [
  "B2B SaaS",
  "Fintech",
  "Healthtech",
  "E-commerce",
  "Cybersecurity",
  "Devtools",
  "Logistics",
  "Martech",
  "HR Tech",
  "Legal Tech",
];
const SIZES = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "501–1,000",
  "1,001–5,000",
];
const HQS = [
  "San Francisco, CA",
  "New York, NY",
  "Austin, TX",
  "London, UK",
  "Berlin, DE",
  "Toronto, CA",
  "Denver, CO",
  "Amsterdam, NL",
];
const FUNDING = [
  "Bootstrapped",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Public",
];
const TECH = [
  "Salesforce",
  "HubSpot",
  "Segment",
  "Snowflake",
  "React",
  "Next.js",
  "Stripe",
  "Intercom",
  "Marketo",
  "AWS",
  "Vercel",
  "Postgres",
  "Kubernetes",
  "Datadog",
  "Zendesk",
];
const TITLES_HOOK = {
  VP: "leading the team through scale",
  Head: "building out the function",
  Director: "owning the number this quarter",
  CEO: "juggling everything at once",
  Founder: "wearing every hat",
  CTO: "balancing roadmap and infra",
  Manager: "in the weeds daily",
};

const EMAIL_PROVIDERS = [
  { name: "Prospeo", cost: 2, rate: 0.55 },
  { name: "Hunter", cost: 1, rate: 0.6 },
  { name: "Dropcontact", cost: 1, rate: 0.75 },
];

/* ---------- templates (Clay-style table presets) ---------- */
function baseCols() {
  return [
    { id: uid(), name: "Name", type: "text" },
    { id: uid(), name: "Title", type: "text" },
    { id: uid(), name: "Company", type: "text" },
    { id: uid(), name: "Domain", type: "text" },
  ];
}
const TEMPLATES = {
  leads: {
    name: "Outbound leads",
    build() {
      const cols = baseCols();
      cols.push(
        {
          id: uid(),
          name: "Work email",
          type: "enrich-email",
          config: { providers: EMAIL_PROVIDERS.map((p) => p.name) },
        },
        { id: uid(), name: "Company data", type: "enrich-company" },
        {
          id: uid(),
          name: "Icebreaker",
          type: "ai",
          config: {
            prompt:
              "Write a one-line personalized opener for {{Name}}, {{Title}} at {{Company}}. Reference their industry and keep it casual, no flattery.",
          },
        },
        { id: uid(), name: "Lead score", type: "score" },
      );
      const people = [
        ["Maya Chen", "VP Sales", "Driftline", "driftline.io"],
        ["Jonas Weber", "Head of Growth", "Kupfer", "kupfer.de"],
        ["Priya Nair", "Director of RevOps", "Statmill", "statmill.com"],
        ["Sam Okafor", "CEO", "Lattichaus", "lattichaus.com"],
        ["Elena Rossi", "Founder", "Corvetta", "corvetta.ai"],
        ["Dan Kowalski", "CTO", "Fjordbyte", "fjordbyte.no"],
        ["Ruth Adler", "Head of Marketing", "Peakform", "peakform.co"],
        ["Leo Tanaka", "VP Engineering", "Kitsune Labs", "kitsunelabs.jp"],
      ];
      return { cols, rows: people.map((p) => mkRow(cols, p)) };
    },
  },
  companies: {
    name: "Target accounts",
    build() {
      const cols = [
        { id: uid(), name: "Company", type: "text" },
        { id: uid(), name: "Domain", type: "text" },
        { id: uid(), name: "Company data", type: "enrich-company" },
        { id: uid(), name: "Tech stack", type: "enrich-tech" },
        {
          id: uid(),
          name: "Fit summary",
          type: "ai",
          config: {
            prompt:
              "In one sentence, say whether {{Company}} is a fit for a data-enrichment product, using their industry and size.",
          },
        },
      ];
      const cos = [
        ["Northbeam", "northbeam.io"],
        ["Vellum", "vellum.ai"],
        ["Tandemly", "tandemly.com"],
        ["Graphex", "graphex.dev"],
        ["Mistral Ops", "mistralops.com"],
        ["Quill & Co", "quillco.com"],
      ];
      return { cols, rows: cos.map((c) => mkRow(cols, c)) };
    },
  },
  inbound: {
    name: "Inbound scoring",
    build() {
      const cols = baseCols();
      cols.push(
        {
          id: uid(),
          name: "Work email",
          type: "enrich-email",
          config: { providers: ["Dropcontact"] },
        },
        { id: uid(), name: "LinkedIn", type: "enrich-linkedin" },
        {
          id: uid(),
          name: "Seniority",
          type: "formula",
          config: {
            formula:
              '{{Title}}.match(/VP|Head|Chief|C[ET]O|Founder|Director/) ? "Senior" : "IC"',
          },
        },
        { id: uid(), name: "Lead score", type: "score" },
      );
      const people = [
        ["Ava Lindqvist", "Growth Manager", "Bryggan", "bryggan.se"],
        ["Marco Silva", "VP Product", "Oceanic", "oceanic.pt"],
        ["Nina Petrova", "Founder", "Zvezda", "zvezda.io"],
        ["Tom Harding", "SDR", "Copperfield", "copperfield.co"],
        ["Lucía Ortiz", "Head of Data", "Andaria", "andaria.es"],
      ];
      return { cols, rows: people.map((p) => mkRow(cols, p)) };
    },
  },
};

function mkRow(cols, values) {
  const cells = {};
  cols.forEach((c, i) => {
    if (c.type === "text")
      cells[c.id] = { value: values[i] ?? "", status: "done" };
    else cells[c.id] = { value: "", status: "empty" };
  });
  return { id: uid(), cells };
}

/* ---------- state ---------- */
let state = {
  cols: [],
  rows: [],
  credits: 1000,
  used: 0,
  filter: "",
  running: 0,
};
let currentTemplate = "leads";

function loadTemplate(key) {
  currentTemplate = key;
  const t = TEMPLATES[key].build();
  state.cols = t.cols;
  state.rows = t.rows;
  state.filter = "";
  $("#search").value = "";
  $("#tableName").textContent = TEMPLATES[key].name;
  document
    .querySelectorAll(".side-item")
    .forEach((b) => b.classList.toggle("active", b.dataset.template === key));
  closePanel();
  render();
}

/* ---------- mock enrichment engines ---------- */
function mockEmail(row) {
  const name = getVal(row, "Name") || getVal(row, "Company") || "lead";
  const domain = getVal(row, "Domain") || "example.com";
  const [first, last] = name.toLowerCase().split(" ").concat(["x"]);
  const patterns = [
    `${first}@${domain}`,
    `${first}.${last}@${domain}`,
    `${first[0]}${last}@${domain}`,
  ];
  return patterns[hash(name + domain) % patterns.length];
}
function mockCompany(row) {
  const key = getVal(row, "Company") || getVal(row, "Domain") || "co";
  const h = hash(key);
  return `${INDUSTRIES[h % INDUSTRIES.length]} · ${SIZES[h % SIZES.length]} employees · ${HQS[h % HQS.length]} · ${FUNDING[h % FUNDING.length]}`;
}
function mockLinkedIn(row) {
  const name = (getVal(row, "Name") || "profile")
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/ /g, "-");
  return `linkedin.com/in/${name}-${(hash(name) % 900) + 100}`;
}
function mockTech(row) {
  const h = hash(getVal(row, "Domain") || getVal(row, "Company") || "x");
  const n = 3 + (h % 3);
  const picks = new Set();
  for (let i = 0; picks.size < n; i++)
    picks.add(TECH[(h + i * 7) % TECH.length]);
  return [...picks].join(", ");
}
function mockAI(row, prompt) {
  const name = (getVal(row, "Name") || getVal(row, "Company") || "there").split(
    " ",
  )[0];
  const title = getVal(row, "Title") || "";
  const company = getVal(row, "Company") || "your team";
  const compData = colByType("enrich-company")
    ? row.cells[colByType("enrich-company").id]?.value || ""
    : "";
  const industry =
    compData.split(" · ")[0] || INDUSTRIES[hash(company) % INDUSTRIES.length];
  const hookKey = Object.keys(TITLES_HOOK).find((k) => title.includes(k));
  const hook = hookKey ? TITLES_HOOK[hookKey] : "moving fast";
  if (/fit/i.test(prompt)) {
    const size =
      compData.split(" · ")[1] ||
      SIZES[hash(company) % SIZES.length] + " employees";
    return `${company} looks like a strong fit — ${industry.toLowerCase()} teams at ${size.trim()} usually feel list-building pain first.`;
  }
  const openers = [
    `${name}, saw ${company} is deep in ${industry.toLowerCase()} — guessing ${hook} means your list-building is still half manual?`,
    `Hey ${name} — most ${title || "ops"} folks I talk to in ${industry.toLowerCase()} are ${hook}. Curious how ${company} handles enrichment today.`,
    `${name}, noticed ${company} just as we shipped our ${industry.toLowerCase()} playbook — felt too on-the-nose not to send.`,
  ];
  return openers[hash(name + company) % openers.length];
}
function mockScore(row) {
  let score = 20;
  for (const c of state.cols) {
    const cell = row.cells[c.id];
    if (!cell || !cell.value) continue;
    if (c.type === "enrich-email") score += 25;
    if (c.type === "enrich-company") score += 15;
    if (c.type === "enrich-linkedin") score += 10;
    if (c.type === "ai") score += 5;
    if (c.type === "text") score += 4;
  }
  const title = getVal(row, "Title");
  if (/VP|Head|Chief|CEO|CTO|Founder|Director/i.test(title)) score += 15;
  return Math.min(99, score + (hash(row.id) % 6));
}
/* ---------- formula engine ----------
   Formulas are user-authored expressions. Running them through new Function()
   would give arbitrary JS this page's origin and force 'unsafe-eval' into the
   CSP, so we parse and walk a small expression language instead: literals,
   regexes, arithmetic/comparison/logic, ternaries, indexing, and method calls
   restricted to the whitelist below. No identifiers resolve except {{Column}}
   refs, so there is no path to window, fetch, or document. */
const FORMULA_METHODS = new Set([
  "toUpperCase",
  "toLowerCase",
  "trim",
  "trimStart",
  "trimEnd",
  "includes",
  "startsWith",
  "endsWith",
  "slice",
  "substring",
  "split",
  "replace",
  "replaceAll",
  "match",
  "indexOf",
  "lastIndexOf",
  "charAt",
  "padStart",
  "padEnd",
  "concat",
  "join",
  "test",
  "toFixed",
  "toString",
  "at",
]);
const FORMULA_PROPS = new Set(["length"]);
const BINOP = {
  "||": 1,
  "??": 1,
  "&&": 2,
  "==": 3,
  "!=": 3,
  "===": 3,
  "!==": 3,
  "<": 4,
  ">": 4,
  "<=": 4,
  ">=": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6,
};
const PUNC3 = ["===", "!=="];
const PUNC2 = ["==", "!=", "<=", ">=", "&&", "||", "??"];
const PUNC1 = [
  "+",
  "-",
  "*",
  "/",
  "%",
  "!",
  "<",
  ">",
  "?",
  ":",
  "(",
  ")",
  "[",
  "]",
  ".",
  ",",
];
const ESCAPES = {
  n: "\n",
  t: "\t",
  r: "\r",
  b: "\b",
  f: "\f",
  v: "\v",
  0: "\0",
};

function tokenizeFormula(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1,
        s = "";
      while (j < src.length && src[j] !== c) {
        if (src[j] === "\\") {
          const e = src[j + 1];
          s += e in ESCAPES ? ESCAPES[e] : e;
          j += 2;
        } else s += src[j++];
      }
      if (j >= src.length) throw new Error("Unterminated string");
      out.push({ type: "str", value: s });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      const n = Number(src.slice(i, j));
      if (Number.isNaN(n)) throw new Error(`Bad number "${src.slice(i, j)}"`);
      out.push({ type: "num", value: n });
      i = j;
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++;
      out.push({ type: "name", value: src.slice(i, j) });
      i = j;
      continue;
    }
    if (c === "/") {
      // a '/' after a value is division; otherwise it opens a regex literal
      const p = out[out.length - 1];
      const afterValue =
        p &&
        (p.type === "num" ||
          p.type === "str" ||
          p.type === "regex" ||
          p.type === "name" ||
          (p.type === "punc" && (p.value === ")" || p.value === "]")));
      if (!afterValue) {
        let j = i + 1,
          body = "",
          cls = false;
        while (j < src.length) {
          const d = src[j];
          if (d === "\\") {
            body += d + (src[j + 1] ?? "");
            j += 2;
            continue;
          }
          if (d === "[") cls = true;
          else if (d === "]") cls = false;
          else if (d === "/" && !cls) break;
          body += d;
          j++;
        }
        if (j >= src.length) throw new Error("Unterminated regex");
        j++;
        let flags = "";
        while (j < src.length && /[a-z]/.test(src[j])) flags += src[j++];
        out.push({ type: "regex", value: { body, flags } });
        i = j;
        continue;
      }
    }
    const three = src.substr(i, 3),
      two = src.substr(i, 2);
    if (PUNC3.includes(three)) {
      out.push({ type: "punc", value: three });
      i += 3;
      continue;
    }
    if (PUNC2.includes(two)) {
      out.push({ type: "punc", value: two });
      i += 2;
      continue;
    }
    if (PUNC1.includes(c)) {
      out.push({ type: "punc", value: c });
      i += 1;
      continue;
    }
    throw new Error(`Unexpected character "${c}"`);
  }
  return out;
}

function parseFormula(tokens) {
  let p = 0;
  const isPunc = (v) => {
    const t = tokens[p];
    return !!t && t.type === "punc" && t.value === v;
  };
  const eat = (v) => {
    if (!isPunc(v)) throw new Error(`Expected "${v}"`);
    p++;
  };

  function parseArgs(close) {
    const args = [];
    if (!isPunc(close)) {
      args.push(parseTernary());
      while (isPunc(",")) {
        p++;
        args.push(parseTernary());
      }
    }
    eat(close);
    return args;
  }
  function parsePrimary() {
    const t = tokens[p];
    if (!t) throw new Error("Unexpected end of formula");
    if (t.type === "num" || t.type === "str") {
      p++;
      return { t: "lit", v: t.value };
    }
    if (t.type === "regex") {
      p++;
      return { t: "regex", body: t.value.body, flags: t.value.flags };
    }
    if (t.type === "name") {
      p++;
      const ref = /^__v(\d+)$/.exec(t.value);
      if (ref) return { t: "var", i: +ref[1] };
      if (t.value === "true") return { t: "lit", v: true };
      if (t.value === "false") return { t: "lit", v: false };
      if (t.value === "null") return { t: "lit", v: null };
      throw new Error(
        `Unknown identifier "${t.value}" — reference columns as {{Name}}`,
      );
    }
    if (isPunc("(")) {
      p++;
      const e = parseTernary();
      eat(")");
      return e;
    }
    if (isPunc("[")) {
      p++;
      return { t: "arr", items: parseArgs("]") };
    }
    throw new Error(`Unexpected "${t.value}"`);
  }
  function parsePostfix() {
    let node = parsePrimary();
    for (;;) {
      if (isPunc(".")) {
        p++;
        const n = tokens[p];
        if (!n || n.type !== "name")
          throw new Error('Expected a property name after "."');
        p++;
        if (isPunc("(")) {
          p++;
          node = { t: "call", obj: node, name: n.value, args: parseArgs(")") };
        } else node = { t: "member", obj: node, name: n.value };
      } else if (isPunc("[")) {
        p++;
        const idx = parseTernary();
        eat("]");
        node = { t: "index", obj: node, idx };
      } else return node;
    }
  }
  function parseUnary() {
    if (isPunc("-") || isPunc("!")) {
      const op = tokens[p].value;
      p++;
      return { t: "un", op, x: parseUnary() };
    }
    return parsePostfix();
  }
  function parseBinary(minPrec) {
    let left = parseUnary();
    for (;;) {
      const t = tokens[p];
      if (!t || t.type !== "punc") return left;
      const prec = BINOP[t.value];
      if (!prec || prec < minPrec) return left;
      p++;
      left = { t: "bin", op: t.value, a: left, b: parseBinary(prec + 1) };
    }
  }
  function parseTernary() {
    const c = parseBinary(1);
    if (!isPunc("?")) return c;
    p++;
    const a = parseTernary();
    eat(":");
    const b = parseTernary();
    return { t: "cond", c, a, b };
  }

  const ast = parseTernary();
  if (p < tokens.length) throw new Error("Unexpected trailing input");
  return ast;
}

function formulaMethod(o, name) {
  const ok =
    typeof o === "string" ||
    typeof o === "number" ||
    typeof o === "boolean" ||
    Array.isArray(o) ||
    o instanceof RegExp;
  if (!ok) throw new Error(`Cannot call "${name}" on this value`);
  const fn = o[name];
  if (typeof fn !== "function")
    throw new Error(`Method "${name}" not available here`);
  return fn;
}

function evalNode(n, scope) {
  switch (n.t) {
    case "lit":
      return n.v;
    case "var":
      return scope[n.i];
    case "regex":
      return new RegExp(n.body, n.flags);
    case "arr":
      return n.items.map((x) => evalNode(x, scope));
    case "un": {
      const v = evalNode(n.x, scope);
      return n.op === "-" ? -v : !v;
    }
    case "cond":
      return evalNode(n.c, scope) ? evalNode(n.a, scope) : evalNode(n.b, scope);
    case "bin": {
      if (n.op === "&&") return evalNode(n.a, scope) && evalNode(n.b, scope);
      if (n.op === "||") return evalNode(n.a, scope) || evalNode(n.b, scope);
      if (n.op === "??") return evalNode(n.a, scope) ?? evalNode(n.b, scope);
      const a = evalNode(n.a, scope),
        b = evalNode(n.b, scope);
      switch (n.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return a / b;
        case "%":
          return a % b;
        case "===":
          return a === b;
        case "!==":
          return a !== b;
        case "==":
          return a == b;
        case "!=":
          return a != b;
        case "<":
          return a < b;
        case ">":
          return a > b;
        case "<=":
          return a <= b;
        case ">=":
          return a >= b;
      }
      throw new Error(`Unsupported operator "${n.op}"`);
    }
    case "member": {
      if (!FORMULA_PROPS.has(n.name))
        throw new Error(`Property "${n.name}" not allowed`);
      const o = evalNode(n.obj, scope);
      if (o == null) throw new Error(`Cannot read "${n.name}" of empty value`);
      return o[n.name];
    }
    case "index": {
      const o = evalNode(n.obj, scope),
        i = evalNode(n.idx, scope);
      if (typeof o !== "string" && !Array.isArray(o))
        throw new Error("Only text and lists can be indexed");
      if (typeof i !== "number") throw new Error("Index must be a number");
      return o[i];
    }
    case "call": {
      if (!FORMULA_METHODS.has(n.name))
        throw new Error(`Method "${n.name}" not allowed`);
      const o = evalNode(n.obj, scope);
      return formulaMethod(o, n.name).apply(
        o,
        n.args.map((x) => evalNode(x, scope)),
      );
    }
  }
  throw new Error("Bad formula");
}

/* Parse once per formula string, then bind each row's values into scope. */
const FORMULA_CACHE = new Map();
function compileFormula(src) {
  const vars = [];
  const expr = String(src ?? "").replace(/\{\{(.+?)\}\}/g, (_, n) => {
    vars.push(n.trim());
    return `__v${vars.length - 1}`;
  });
  return { ast: parseFormula(tokenizeFormula(expr)), vars };
}
function evalFormula(row, formula) {
  const src = String(formula ?? "");
  let compiled = FORMULA_CACHE.get(src);
  if (!compiled) {
    try {
      compiled = compileFormula(src);
    } catch (e) {
      compiled = { error: e.message };
    }
    FORMULA_CACHE.set(src, compiled);
  }
  if (compiled.error) throw new Error(compiled.error);
  const scope = compiled.vars.map((name) => getVal(row, name));
  return String(evalNode(compiled.ast, scope));
}

function getVal(row, colName) {
  const col = state.cols.find(
    (c) => c.name.toLowerCase() === colName.toLowerCase(),
  );
  return col ? row.cells[col.id]?.value || "" : "";
}
function colByType(t) {
  return state.cols.find((c) => c.type === t);
}

/* ---------- running cells ---------- */
async function runCell(row, col, { fast = false } = {}) {
  const cell =
    row.cells[col.id] || (row.cells[col.id] = { value: "", status: "empty" });
  if (col.type === "text") return;
  cell.status = "running";
  cell.provider = null;
  cell.error = null;
  state.running++;
  updateCellDom(row, col);

  const base = fast ? 120 : 300;
  try {
    if (col.type === "enrich-email") {
      const provs = col.config?.providers?.length
        ? col.config.providers
        : ["Dropcontact"];
      let found = null;
      for (const pName of provs) {
        const p = EMAIL_PROVIDERS.find((x) => x.name === pName) || {
          name: pName,
          cost: 1,
          rate: 0.6,
        };
        cell.providerTrying = p.name;
        updateCellDom(row, col);
        await sleep(base + Math.random() * 400);
        spend(p.cost);
        const ok = (hash(row.id + p.name) % 100) / 100 < p.rate;
        if (ok) {
          found = { email: mockEmail(row), provider: p.name };
          break;
        }
      }
      if (found) {
        cell.value = found.email;
        cell.provider = found.provider;
        cell.status = "done";
      } else {
        cell.status = "failed";
        cell.error = "No match in waterfall";
      }
    } else if (col.type === "enrich-company") {
      cell.providerTrying = "Clearbit";
      updateCellDom(row, col);
      await sleep(base + Math.random() * 500);
      spend(2);
      cell.value = mockCompany(row);
      cell.provider = "Clearbit";
      cell.status = "done";
    } else if (col.type === "enrich-linkedin") {
      cell.providerTrying = "Prospeo";
      updateCellDom(row, col);
      await sleep(base + Math.random() * 400);
      spend(1);
      cell.value = mockLinkedIn(row);
      cell.provider = "Prospeo";
      cell.status = "done";
    } else if (col.type === "enrich-tech") {
      cell.providerTrying = "BuiltWith";
      updateCellDom(row, col);
      await sleep(base + Math.random() * 500);
      spend(1);
      cell.value = mockTech(row);
      cell.provider = "BuiltWith";
      cell.status = "done";
    } else if (col.type === "ai") {
      cell.providerTrying = "Claude";
      updateCellDom(row, col);
      await sleep(base + 400 + Math.random() * 700);
      spend(2);
      cell.value = mockAI(row, col.config?.prompt || "");
      cell.provider = "Claude";
      cell.status = "done";
    } else if (col.type === "formula") {
      await sleep(80);
      cell.value = evalFormula(row, col.config?.formula || '""');
      cell.status = "done";
    } else if (col.type === "score") {
      await sleep(base);
      cell.value = mockScore(row);
      cell.status = "done";
    }
  } catch (e) {
    cell.status = "failed";
    cell.error = e.message;
  }
  state.running--;
  updateCellDom(row, col);
  updateStats();
}

async function runColumn(col) {
  if (col.type === "text") return;
  const rows = visibleRows();
  toast(`Running “${col.name}” on ${rows.length} rows…`);
  // stagger starts so the waterfall cascades down the column
  await Promise.all(
    rows.map((r, i) => sleep(i * 140).then(() => runCell(r, col))),
  );
  $("#statRun").textContent =
    `Last run: ${col.name} · ${new Date().toLocaleTimeString()}`;
  toast(`“${col.name}” finished`);
}

async function runAll() {
  const cols = state.cols.filter((c) => c.type !== "text");
  $("#runAllBtn").disabled = true;
  for (const col of cols) {
    // score & formula columns depend on enrichment output — they run last in order
    await runColumn(col);
  }
  $("#runAllBtn").disabled = false;
  $("#statRun").textContent =
    `Full run finished · ${new Date().toLocaleTimeString()}`;
}

function spend(n) {
  state.used += n;
  $("#creditsLeft").textContent = (state.credits - state.used).toLocaleString();
  $("#usedCredits").textContent = state.used.toLocaleString();
  $("#usageFill").style.width =
    Math.min(100, (state.used / state.credits) * 100) + "%";
  $("#creditsHint").textContent =
    `${(state.credits - state.used).toLocaleString()} credits remaining`;
}

/* ---------- rendering ---------- */
function visibleRows() {
  if (!state.filter) return state.rows;
  const q = state.filter.toLowerCase();
  return state.rows.filter((r) =>
    state.cols.some((c) =>
      String(r.cells[c.id]?.value ?? "")
        .toLowerCase()
        .includes(q),
    ),
  );
}

const TYPE_META = {
  text: { ico: "T", cls: "t-text" },
  "enrich-email": { ico: "@", cls: "t-enrich" },
  "enrich-company": { ico: "◆", cls: "t-enrich" },
  "enrich-linkedin": { ico: "in", cls: "t-enrich" },
  "enrich-tech": { ico: "{}", cls: "t-enrich" },
  ai: { ico: "✦", cls: "t-ai" },
  formula: { ico: "ƒ", cls: "t-formula" },
  score: { ico: "%", cls: "t-score" },
};

function render() {
  const grid = $("#grid");
  const rows = visibleRows();
  let html = '<thead><tr><th class="rownum-h">#</th>';
  for (const col of state.cols) {
    const m = TYPE_META[col.type];
    html += `<th class="${m.cls}"><div class="col-head" data-col="${col.id}">
      <span class="col-type-ico">${m.ico}</span>${esc(col.name)}
      ${col.type !== "text" ? `<button class="col-run" data-run="${col.id}" title="Run column">▶</button>` : ""}
    </div></th>`;
  }
  html += `<th><div class="add-col-cell" id="addColHead">+ Add column</div></th></tr></thead><tbody>`;
  rows.forEach((row, i) => {
    html += `<tr data-row="${row.id}"><td class="rownum" data-open="${row.id}">${i + 1}</td>`;
    for (const col of state.cols) {
      html += `<td data-cell="${row.id}:${col.id}">${cellHTML(row, col)}</td>`;
    }
    html += "<td></td></tr>";
  });
  html += "</tbody>";
  grid.innerHTML = html;
  updateStats();
}

function cellHTML(row, col) {
  const cell = row.cells[col.id] || { value: "", status: "empty" };
  if (col.type === "text") {
    return `<div class="cell" contenteditable spellcheck="false" data-edit="${row.id}:${col.id}">${esc(cell.value)}</div>`;
  }
  if (cell.status === "running") {
    return `<div class="cell cell-running"><span class="spinner"></span>${esc(cell.providerTrying || "")}…</div>`;
  }
  if (cell.status === "failed") {
    return `<div class="cell cell-fail">✕ ${esc(cell.error || "Failed")}</div>`;
  }
  if (cell.status === "done" && cell.value !== "") {
    if (col.type === "score") {
      const v = +cell.value;
      const color =
        v >= 70 ? "var(--moss)" : v >= 45 ? "var(--amber)" : "#A33B2A";
      return `<div class="score-wrap pop-in"><div class="score-bar"><div class="score-fill" style="width:${v}%;background:${color}"></div></div><span class="score-num">${v}</span></div>`;
    }
    const mono = ["enrich-email", "enrich-linkedin", "enrich-tech"].includes(
      col.type,
    )
      ? " mono"
      : "";
    const badge = cell.provider
      ? `<span class="prov-badge${col.type === "ai" ? " ai" : ""}">${esc(cell.provider)}</span>`
      : "";
    return `<div class="cell cell-done pop-in">${badge}<span class="cell-val${mono}" title="${esc(cell.value)}">${esc(cell.value)}</span></div>`;
  }
  return `<div class="cell cell-pending">—</div>`;
}

function updateCellDom(row, col) {
  const td = document.querySelector(`[data-cell="${row.id}:${col.id}"]`);
  if (td) td.innerHTML = cellHTML(row, col);
}

function updateStats() {
  $("#statRows").textContent = `${state.rows.length} rows`;
  $("#statCols").textContent = `${state.cols.length} columns`;
  $("#rowCountSide").textContent = state.rows.length;
}

/* ---------- panel: column settings / record detail ---------- */
function openPanel(title, bodyHTML) {
  $("#panelTitle").textContent = title;
  $("#panelBody").innerHTML = bodyHTML;
  $("#panel").classList.add("open");
}
function closePanel() {
  $("#panel").classList.remove("open");
}

function openColumnPanel(col) {
  let extra = "";
  if (col.type === "enrich-email") {
    const provs = col.config?.providers || [];
    extra = `<div class="field"><label>Waterfall order</label><div class="wf-list">
      ${provs
        .map((p, i) => {
          const meta = EMAIL_PROVIDERS.find((x) => x.name === p);
          return `<div class="wf-step"><span class="wf-num">${i + 1}</span>${esc(p)}<span class="wf-cost">${meta ? meta.cost : 1} cr</span></div>`;
        })
        .join("")}
    </div><p style="font-size:11.5px;color:var(--ink-soft);margin-top:6px">Each provider is tried in order until one returns a verified email. You only pay for providers that run.</p></div>`;
  }
  if (col.type === "ai") {
    extra = `<div class="field"><label>Prompt · use {{Column}} to reference row data</label>
      <textarea id="cfgPrompt">${esc(col.config?.prompt || "")}</textarea></div>
      <div class="field"><label>Model</label><select><option>Claude (fast)</option><option>Claude (thinking)</option></select></div>`;
  }
  if (col.type === "formula") {
    extra = `<div class="field"><label>Formula · expression with {{Column}} refs</label>
      <textarea id="cfgFormula">${esc(col.config?.formula || "")}</textarea></div>`;
  }
  openPanel(
    "Column settings",
    `
    <div class="field"><label>Column name</label><input type="text" id="cfgName" value="${esc(col.name)}"></div>
    ${extra}
    <div class="panel-actions">
      <button class="btn primary" id="cfgSave">Save</button>
      ${col.type !== "text" ? `<button class="btn ghost" id="cfgRun">▶ Run column</button>` : ""}
      <button class="btn ghost danger" id="cfgDelete">Delete</button>
    </div>`,
  );
  $("#cfgSave").onclick = () => {
    col.name = $("#cfgName").value.trim() || col.name;
    if ($("#cfgPrompt")) (col.config ??= {}).prompt = $("#cfgPrompt").value;
    if ($("#cfgFormula")) (col.config ??= {}).formula = $("#cfgFormula").value;
    render();
    closePanel();
    toast("Column saved");
  };
  const runBtn = $("#cfgRun");
  if (runBtn)
    runBtn.onclick = () => {
      closePanel();
      runColumn(col);
    };
  $("#cfgDelete").onclick = () => {
    state.cols = state.cols.filter((c) => c.id !== col.id);
    state.rows.forEach((r) => delete r.cells[col.id]);
    render();
    closePanel();
    toast("Column deleted");
  };
}

function openRecordPanel(row) {
  const fields = state.cols
    .map((c) => {
      const cell = row.cells[c.id];
      return `<div class="record-field"><b>${esc(c.name)}</b><span>${esc(cell?.value || "—")}</span></div>`;
    })
    .join("");
  openPanel(
    "Record",
    `${fields}
    <div class="panel-actions">
      <button class="btn primary" id="recRun">▶ Enrich this row</button>
      <button class="btn ghost danger" id="recDelete">Delete row</button>
    </div>`,
  );
  $("#recRun").onclick = async () => {
    closePanel();
    for (const c of state.cols.filter((c) => c.type !== "text"))
      await runCell(row, c, { fast: true });
    toast("Row enriched");
  };
  $("#recDelete").onclick = () => {
    state.rows = state.rows.filter((r) => r.id !== row.id);
    render();
    closePanel();
  };
}

/* ---------- add column modal ---------- */
let modalType = null;
function openModal() {
  modalType = null;
  $("#modalVeil").hidden = false;
  $("#modalAdd").disabled = true;
  $("#modalConfig").innerHTML = "";
  document
    .querySelectorAll(".type-card")
    .forEach((c) => c.classList.remove("sel"));
}
function closeModal() {
  $("#modalVeil").hidden = true;
}

document.querySelectorAll(".type-card").forEach((card) => {
  card.addEventListener("click", () => {
    document
      .querySelectorAll(".type-card")
      .forEach((c) => c.classList.remove("sel"));
    card.classList.add("sel");
    modalType = card.dataset.type;
    $("#modalAdd").disabled = false;
    const defaults = {
      text: "New field",
      "enrich-email": "Work email",
      "enrich-company": "Company data",
      "enrich-linkedin": "LinkedIn",
      "enrich-tech": "Tech stack",
      ai: "AI output",
      formula: "Formula",
      score: "Lead score",
    };
    let cfg = `<div class="field"><label>Column name</label><input type="text" id="newColName" value="${defaults[modalType]}"></div>`;
    if (modalType === "ai")
      cfg += `<div class="field"><label>Prompt · use {{Column}} refs</label><textarea id="newColPrompt">Write a one-line personalized opener for {{Name}}, {{Title}} at {{Company}}.</textarea></div>`;
    if (modalType === "formula")
      cfg += `<div class="field"><label>Formula</label><textarea id="newColFormula">{{Company}}.toUpperCase()</textarea></div>`;
    if (modalType === "enrich-email")
      cfg += `<div class="field"><label>Waterfall</label><div class="wf-list">${EMAIL_PROVIDERS.map((p, i) => `<div class="wf-step"><span class="wf-num">${i + 1}</span>${p.name}<span class="wf-cost">${p.cost} cr</span></div>`).join("")}</div></div>`;
    $("#modalConfig").innerHTML = cfg;
  });
});

$("#modalAdd").addEventListener("click", () => {
  if (!modalType) return;
  const col = {
    id: uid(),
    name: $("#newColName")?.value.trim() || "Column",
    type: modalType,
    config: {},
  };
  if (modalType === "ai") col.config.prompt = $("#newColPrompt").value;
  if (modalType === "formula") col.config.formula = $("#newColFormula").value;
  if (modalType === "enrich-email")
    col.config.providers = EMAIL_PROVIDERS.map((p) => p.name);
  state.cols.push(col);
  state.rows.forEach((r) => (r.cells[col.id] = { value: "", status: "empty" }));
  closeModal();
  render();
  toast(`Column “${col.name}” added — press ▶ on its header to run it`);
});

/* ---------- CSV import / export ---------- */
function parseCSV(text) {
  const rows = [];
  let cur = [""],
    inQ = false,
    r = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') {
        cur[cur.length - 1] += '"';
        i++;
      } else if (ch === '"') inQ = false;
      else cur[cur.length - 1] += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") cur.push("");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      rows.push(cur);
      cur = [""];
    } else cur[cur.length - 1] += ch;
  }
  if (cur.length > 1 || cur[0] !== "") rows.push(cur);
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

$("#csvFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const rows = parseCSV(await file.text());
  if (rows.length < 2) return toast("CSV needs a header row + data");
  const header = rows[0];
  state.cols = header.map((h) => ({
    id: uid(),
    name: h.trim() || "Column",
    type: "text",
  }));
  state.rows = rows.slice(1).map((vals) => mkRow(state.cols, vals));
  $("#tableName").textContent = file.name.replace(/\.csv$/i, "");
  render();
  toast(`Imported ${state.rows.length} rows — add enrichment columns to start`);
  e.target.value = "";
});

$("#exportBtn").addEventListener("click", () => {
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [state.cols.map((c) => q(c.name)).join(",")];
  for (const r of state.rows)
    lines.push(state.cols.map((c) => q(r.cells[c.id]?.value)).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = ($("#tableName").textContent.trim() || "kiln-table") + ".csv";
  a.click();
  toast("CSV exported");
});

/* ---------- events ---------- */
$("#grid").addEventListener("click", (e) => {
  const run = e.target.closest("[data-run]");
  if (run) {
    e.stopPropagation();
    runColumn(state.cols.find((c) => c.id === run.dataset.run));
    return;
  }
  const head = e.target.closest("[data-col]");
  if (head) {
    openColumnPanel(state.cols.find((c) => c.id === head.dataset.col));
    return;
  }
  const rn = e.target.closest("[data-open]");
  if (rn) {
    openRecordPanel(state.rows.find((r) => r.id === rn.dataset.open));
    return;
  }
  if (e.target.closest("#addColHead")) openModal();
});
$("#grid").addEventListener("input", (e) => {
  const ed = e.target.closest("[data-edit]");
  if (!ed) return;
  const [rowId, colId] = ed.dataset.edit.split(":");
  const row = state.rows.find((r) => r.id === rowId);
  if (row) row.cells[colId] = { value: ed.textContent, status: "done" };
});
$("#search").addEventListener("input", (e) => {
  state.filter = e.target.value;
  render();
});
$("#addRowBtn").addEventListener("click", () => {
  state.rows.push(mkRow(state.cols, []));
  render();
});
$("#addColBtn").addEventListener("click", openModal);
$("#runAllBtn").addEventListener("click", runAll);
$("#importBtn").addEventListener("click", () => $("#csvFile").click());
$("#panelClose").addEventListener("click", closePanel);
$("#modalClose").addEventListener("click", closeModal);
$("#modalCancel").addEventListener("click", closeModal);
$("#modalVeil").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});
document
  .querySelectorAll(".side-item")
  .forEach((b) =>
    b.addEventListener("click", () => loadTemplate(b.dataset.template)),
  );
document.querySelectorAll(".integ").forEach((el) =>
  el.addEventListener("click", () => {
    const on = el.dataset.on === "1" ? "0" : "1";
    el.dataset.on = on;
    el.querySelector(".dot").classList.toggle("on", on === "1");
    toast(
      `${el.textContent.trim().split(" ")[0]} ${on === "1" ? "connected" : "disconnected"}`,
    );
  }),
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closePanel();
  }
});

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

/* ---------- boot ---------- */
loadTemplate("leads");
