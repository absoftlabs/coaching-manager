// Client-side printable documents (fee invoice, mark sheet, student profile).
// Every interpolated value goes through esc() since names are user input.
import { esc, formatDate, formatDateTime } from "@/lib/utils";
import { GRADE_SCALE, getGpa, percentOf } from "@/lib/grade";
import type { FeeDTO, ResultDTO, StudentDTO } from "@/lib/types";

export type PrintOrg = { name: string; phone: string; address: string; logo: string };

// A4 portrait, in mm. Content is laid out at the printable width and scaled
// down (never up) so every document fits on a single page.
const A4_W = 210;
const A4_H = 297;
const PAGE_MARGIN = 8;
const MM_TO_PX = 96 / 25.4;

const BASE = `
  *{box-sizing:border-box}
  body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;padding:24px;color:#111;background:#fff}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #444;padding:7px 9px;font-size:13px;text-align:left}
  .head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px}
  .logo{width:66px;height:66px;object-fit:contain;border:0}
  .org{flex:1;text-align:center}
  .org-name{font-size:21px;font-weight:800;text-transform:uppercase;letter-spacing:.02em}
  .org-sub{font-size:12px;color:#374151}
  #page{width:${A4_W - 2 * PAGE_MARGIN}mm;margin:0 auto}
  @page{size:A4 portrait;margin:${PAGE_MARGIN}mm}
  @media print{body{padding:0}}
`;

function header(org: PrintOrg, extra = "") {
    return `<div class="head"><img class="logo" src="${esc(org.logo)}" alt=""/><div class="org">
      <div class="org-name">${esc(org.name)}</div>
      <div class="org-sub">${esc(org.address)}</div>
      <div class="org-sub">Phone: ${esc(org.phone)}</div>${extra}</div></div>`;
}

function openAndPrint(title: string, body: string, styles = "") {
    const win = window.open("", "_blank");
    if (!win) {
        alert("Please allow pop-ups to print.");
        return;
    }
    win.document.write(
        `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(title)}</title><style>${BASE}${styles}</style></head><body><div id="page">${body}</div></body></html>`
    );
    win.document.close();
    win.focus();
    // Shrink the content when it is taller than one A4 page.
    const fitToPage = () => {
        const page = win.document.getElementById("page");
        if (!page) return;
        page.style.removeProperty("zoom");
        const available = (A4_H - 2 * PAGE_MARGIN) * MM_TO_PX * 0.98;
        const height = page.scrollHeight;
        if (height > available) page.style.setProperty("zoom", String(available / height));
    };
    // Wait for images (logo/photo) before printing; the timeout is a fallback
    // for browsers that already fired load. The flag prevents a double dialog.
    let printed = false;
    const go = () => {
        if (printed) return;
        printed = true;
        fitToPage();
        win.print();
    };
    win.onload = () => setTimeout(go, 150);
    setTimeout(go, 1200);
}

export function printFeeInvoice(fee: FeeDTO, org: PrintOrg) {
    const navy = NAVY;
    const gold = GOLD;
    // Premium frame scaled down so two copies share one A4 page.
    const styles = `${PREMIUM_STYLES(navy, gold)}
      .sheet{min-height:133mm}
      .frame{padding:16px 22px 14px}
      .corner{width:46px;height:46px}
      .wm{width:62mm;height:62mm;top:57%}
      .head{padding-bottom:6px;margin-bottom:4px}
      .logo{width:52px;height:52px}
      .org-name{font-size:18px}
      .org-sub{font-size:11.5px}
      .copy-tag{display:inline-block;margin-top:4px;border:1px solid ${gold};color:${gold};font-size:10.5px;font-weight:700;letter-spacing:.16em;padding:1px 10px}
      .rule{margin-bottom:9px}
      .title{margin:0 0 10px}
      .title span{font-size:13px;padding:4px 20px;letter-spacing:.2em}
      .meta th,.meta td{padding:5px 9px;font-size:12.5px;border-color:#c9b98f;text-align:left}
      .meta th{width:160px;background:rgba(246,238,216,.75);color:#4b5563;font-weight:600}
      .meta td{background:rgba(255,255,255,.6);font-weight:600}
      .meta tr.amount th,.meta tr.amount td{background:rgba(246,238,216,.95);color:${navy};font-size:14px}
      .footer{padding-top:34px;justify-content:space-between;gap:24px}
      .sign{min-width:0;width:40%;font-size:12.5px}
      .cut{border-top:1px dashed #9ca3af;margin:3mm 0}
      .content{position:relative}
      .stamp{position:absolute;right:34px;top:47%;width:200px;transform:rotate(-14deg);opacity:.82;mix-blend-mode:multiply;pointer-events:none;z-index:2;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    `;
    const paidDate = esc(formatDate(fee.createdAt)).toUpperCase();
    // Rubber "PAID" stamp: double rounded frame, red ink, and a noise mask
    // so the ink looks unevenly pressed like a real hand stamp.
    const stamp = (id: string) => `<svg class="stamp" viewBox="0 0 220 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><filter id="ink-${id}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${id === "office" ? 4 : 9}" result="noise"/>
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.6" result="mask"/>
        <feComposite in="SourceGraphic" in2="mask" operator="in"/>
      </filter></defs>
      <g filter="url(#ink-${id})" font-family="Impact,'Arial Black',ui-sans-serif,sans-serif">
        <rect x="4" y="4" width="212" height="104" rx="12" fill="none" stroke="#c0161c" stroke-width="6"/>
        <rect x="13" y="13" width="194" height="86" rx="7" fill="none" stroke="#c0161c" stroke-width="2"/>
        <text x="110" y="72" text-anchor="middle" font-size="58" font-weight="900" letter-spacing="8" fill="#c0161c">PAID</text>
        <line x1="34" y1="80" x2="186" y2="80" stroke="#c0161c" stroke-width="1.5"/>
        <text x="110" y="93" text-anchor="middle" font-size="12.5" font-weight="700" letter-spacing="2" fill="#c0161c">${paidDate}</text>
      </g></svg>`;
    const copy = (label: string) =>
        premiumSheet(
            org,
            "FEE RECEIPT",
            `${stamp(label === "Office Copy" ? "office" : "student")}
      <table class="meta">
        <tr><th>Receipt No</th><td>#${fee.id}</td></tr>
        <tr><th>Student Name</th><td>${esc(fee.studentName)}</td></tr>
        <tr><th>Student ID</th><td>${esc(fee.studentId)}</td></tr>
        <tr class="amount"><th>Amount</th><td>৳ ${Number(fee.amount).toLocaleString("en-IN")}</td></tr>
        <tr><th>Deposit By</th><td>${esc(fee.depositBy)}</td></tr>
        <tr><th>Received By</th><td>${esc(fee.receivedBy)}</td></tr>
        <tr><th>Date</th><td>${esc(formatDateTime(fee.createdAt))}</td></tr>
      </table>`,
            { headerExtra: `<div class="copy-tag">${label.toUpperCase()}</div>`, signs: ["Depositor Sign", "Receiver Sign"] }
        );
    openAndPrint(`Fee Invoice - ${fee.studentName}`, `${copy("Office Copy")}<div class="cut"></div>${copy("Student Copy")}`, styles);
}

// Gold flourish for the certificate frame corners (drawn for the top-left
// corner; the other three are mirrored with CSS).
const CORNER = `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="none" stroke="#b08a2e">
  <path d="M2 58V14Q2 2 14 2H58" stroke-width="2.4"/>
  <path d="M8 58V18Q8 8 18 8H58" stroke-width="1"/>
  <path d="M14 40Q14 14 40 14" stroke-width="1"/>
  <path d="M20 20l6-9 3 9-3 9z M20 20l9-6-9-3-9 3z" fill="#b08a2e" stroke="none"/>
  <circle cx="20" cy="20" r="2.4" fill="#fff" stroke-width="1"/>
</svg>`;

const NAVY = "#1b2f55";
const GOLD = "#b08a2e";

// Shared certificate look (outer navy border, gold double frame with corner
// flourishes, diagonal line pattern, centred logo watermark, title banner).
const PREMIUM_STYLES = (navy: string, gold: string) => `
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .sheet{min-height:274mm;border:3px solid ${navy};padding:4px;page-break-inside:avoid;display:flex;
        background:
          repeating-linear-gradient(45deg,rgba(27,47,85,.05) 0 1px,transparent 1px 6px),
          repeating-linear-gradient(-45deg,rgba(176,138,46,.06) 0 1px,transparent 1px 6px),#fff}
      .frame{position:relative;flex:1;display:flex;flex-direction:column;border:2px solid ${gold};outline:1px solid ${gold};outline-offset:-6px;padding:26px 30px 22px;overflow:hidden}
      .corner{position:absolute;width:68px;height:68px;z-index:2}
      .corner svg{width:100%;height:100%;display:block}
      .c-tl{top:-1px;left:-1px}.c-tr{top:-1px;right:-1px;transform:scaleX(-1)}
      .c-bl{bottom:-1px;left:-1px;transform:scaleY(-1)}.c-br{bottom:-1px;right:-1px;transform:scale(-1,-1)}
      .wm{position:absolute;left:50%;top:54%;width:105mm;height:105mm;object-fit:contain;transform:translate(-50%,-50%);opacity:.08;z-index:0;pointer-events:none}
      .content{position:relative;z-index:1;flex:1;display:flex;flex-direction:column}
      .head{border-bottom:2px solid ${gold};padding-bottom:10px;margin-bottom:6px}
      .org-name{color:${navy};font-family:Georgia,"Times New Roman",serif;font-size:23px}
      .rule{height:3px;border-bottom:1px solid ${navy};margin-bottom:14px}
      .title{display:flex;align-items:center;gap:14px;justify-content:center;margin:2px 0 14px}
      .title span{background:${navy};color:#f6e7b8;font-family:Georgia,"Times New Roman",serif;font-weight:700;font-size:17px;letter-spacing:.22em;padding:6px 26px;border:1px solid ${gold};box-shadow:0 0 0 3px #fff,0 0 0 4px ${gold}}
      .title i{flex:1;max-width:90px;height:1px;background:${gold}}
      .footer{margin-top:auto;padding-top:60px;display:flex;justify-content:flex-end}
      .sign{border-top:1px solid ${navy};padding-top:4px;font-size:14px;font-weight:600;min-width:190px;text-align:center;color:${navy}}
`;

/** Wraps page content in the premium certificate frame. */
function premiumSheet(
    org: PrintOrg,
    title: string,
    content: string,
    opts: { headerExtra?: string; signs?: string[] } = {}
) {
    const corners = ["tl", "tr", "bl", "br"].map((c) => `<div class="corner c-${c}">${CORNER}</div>`).join("");
    const signs = (opts.signs ?? ["Director's Signature"]).map((s) => `<div class="sign">${esc(s)}</div>`).join("");
    return `<div class="sheet"><div class="frame">${corners}
      <img class="wm" src="${esc(org.logo)}" alt=""/>
      <div class="content">${header(org, opts.headerExtra)}<div class="rule"></div>
      <div class="title"><i></i><span>${esc(title)}</span><i></i></div>
      ${content}
      <div class="footer">${signs}</div></div></div></div>`;
}

export function printMarkSheet(r: ResultDTO, org: PrintOrg) {
    const navy = NAVY;
    const gold = GOLD;
    const styles = `${PREMIUM_STYLES(navy, gold)}
      .info{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:16px}
      .who td{border:0;padding:3px 0;font-size:13.5px;text-align:left;background:none}
      .who td:first-child{width:96px;color:#4b5563}
      .who td:nth-child(2){width:14px;color:#4b5563}
      .who td:last-child{font-weight:600}
      .chart{width:60mm;flex:none}
      .chart caption{background:${gold};color:#fff;font-size:10.5px;font-weight:700;letter-spacing:.12em;padding:3px}
      .chart th,.chart td{padding:2px 6px;font-size:10.5px;border-color:${gold};background:rgba(255,255,255,.7)}
      .chart th{background:#f6eed8;color:${navy}}
      th,td{text-align:center;padding:6px 7px;font-size:12.5px}
      .marks th,.marks td{border-color:#7b8bb0}
      .marks thead th{background:${navy};color:#fff;font-weight:600;border-color:${navy}}
      .marks tbody td{background:rgba(255,255,255,.6)}
      .marks tbody tr:nth-child(even) td{background:rgba(238,242,250,.6)}
      .marks tfoot th{background:#f6eed8;color:${navy};border-color:${gold}}
    `;
    const rows = r.subjects
        .map((s, i) => {
            const p = percentOf(s.totalGain, s.totalMarks);
            const g = getGpa(p);
            return `<tr><td>${i + 1}</td><td style="text-align:left">${esc(s.className)}</td><td>${s.mcqGain}/${s.mcqTotal}</td><td>${s.quesGain}/${s.quesTotal}</td><td>${s.totalGain}/${s.totalMarks}</td><td>${p.toFixed(2)}%</td><td>${g.grade} [${g.point.toFixed(2)}]</td></tr>`;
        })
        .join("");
    const pct = percentOf(r.totalGain, r.totalMarks);
    const overall = getGpa(pct);
    const info = (label: string, v: string) => `<tr><td>${label}</td><td>:</td><td>${esc(v)}</td></tr>`;
    const chartRows = GRADE_SCALE.map((g) => `<tr><td>${g.range}</td><td><b>${g.grade}</b></td><td>${g.point.toFixed(2)}</td></tr>`).join("");

    const body = premiumSheet(org, "MARK SHEET", `
      <div class="info">
        <table class="who">
          ${info("Student", r.studentName)}${info("Student ID", r.studentId)}${info("Batch", r.batch)}
          ${info("Result Type", r.resultType)}${info("Exam Date", formatDate(r.examDate))}
        </table>
        <table class="chart"><caption>GRADING CHART</caption>
          <thead><tr><th>Marks (%)</th><th>Grade</th><th>Point</th></tr></thead>
          <tbody>${chartRows}</tbody>
        </table>
      </div>
      <table class="marks">
        <thead><tr><th>SL</th><th>Subject</th><th>MCQ (G/T)</th><th>Written (G/T)</th><th>Total (G/T)</th><th>Percentage</th><th>GPA</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><th colspan="4" style="text-align:right">Grand Total</th><th>${r.totalGain}/${r.totalMarks}</th><th>${pct.toFixed(2)}%</th><th>${overall.grade} [${overall.point.toFixed(2)}]</th></tr></tfoot>
      </table>`);
    openAndPrint(`Marksheet - ${r.studentName}`, body, styles);
}

export function printStudentProfile(s: StudentDTO, org: PrintOrg) {
    const navy = NAVY;
    const gold = GOLD;
    const styles = `${PREMIUM_STYLES(navy, gold)}
      .who{display:flex;gap:20px;align-items:center;margin:4px 0 18px;padding:12px 16px;background:rgba(246,238,216,.55);border:1px solid ${gold}}
      .avatar{width:96px;height:110px;object-fit:cover;border:2px solid ${gold};outline:1px solid ${gold};outline-offset:2px;background:#f3f4f6;flex:none}
      .name{font-family:Georgia,"Times New Roman",serif;font-size:22px;font-weight:700;color:${navy}}
      .sid{margin-top:4px;font-family:ui-monospace,monospace;font-size:14px;color:#374151}
      .badge{display:inline-block;margin-top:8px;background:${navy};color:#f6e7b8;font-size:11.5px;font-weight:600;letter-spacing:.06em;padding:3px 10px}
      .section{margin-bottom:14px}
      .section h3{margin:0 0 6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${navy};display:flex;align-items:center;gap:10px}
      .section h3::after{content:"";flex:1;height:1px;background:${gold}}
      .fields td,.fields th{padding:6px 9px;font-size:13px;border-color:#c9b98f;text-align:left}
      .fields th{width:19%;background:rgba(246,238,216,.75);color:#4b5563;font-weight:600}
      .fields td{width:31%;background:rgba(255,255,255,.6);font-weight:600}
    `;
    const v = (x: unknown) => esc(x == null || x === "" ? "-" : x);
    // Two label/value pairs per row.
    const section = (title: string, pairs: [string, unknown][]) => {
        const rows: string[] = [];
        for (let i = 0; i < pairs.length; i += 2) {
            const [a, b] = [pairs[i], pairs[i + 1]];
            rows.push(
                b
                    ? `<tr><th>${a[0]}</th><td>${v(a[1])}</td><th>${b[0]}</th><td>${v(b[1])}</td></tr>`
                    : `<tr><th>${a[0]}</th><td colspan="3">${v(a[1])}</td></tr>`
            );
        }
        return `<div class="section"><h3>${title}</h3><table class="fields">${rows.join("")}</table></div>`;
    };
    const photo = s.photoUrl ? `<img class="avatar" src="${esc(s.photoUrl)}" alt=""/>` : `<div class="avatar"></div>`;
    const body = premiumSheet(org, "STUDENT PROFILE", `
      <div class="who">${photo}<div>
        <div class="name">${esc(s.name)}</div>
        <div class="sid">ID: ${esc(s.studentId)}</div>
        ${s.batch ? `<div class="badge">${esc(s.batch)}</div>` : ""}
      </div></div>
      ${section("Academic Information", [
          ["Batch", s.batch],
          ["Roll", s.roll],
          ["Group", s.division],
          ["Course Fee", s.courseFee != null ? `৳ ${s.courseFee}` : ""],
          ["School Name", s.schoolName],
          ["School Roll", s.schoolRoll],
          ["School Section", s.schoolSection],
      ])}
      ${section("Personal Information", [
          ["Gender", s.gender],
          ["Birth Date", s.birthDate],
          ["Address", s.address],
      ])}
      ${section("Guardian Information", [
          ["Father", s.fatherName],
          ["Mother", s.motherName],
          ["Guardian", s.guardianName],
          ["Guardian Phone", s.guardianPhone],
      ])}`);
    openAndPrint(`${s.name} - ${s.studentId}`, body, styles);
}
