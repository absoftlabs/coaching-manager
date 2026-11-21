// Client-side printable documents (fee invoice, mark sheet, student profile).
// Every interpolated value goes through esc() since names are user input.
import { esc, formatDate, formatDateTime } from "@/lib/utils";
import { getGpa, percentOf } from "@/lib/grade";
import type { FeeDTO, ResultDTO, StudentDTO } from "@/lib/types";

export type PrintOrg = { name: string; phone: string; address: string; logo: string };

const BASE = `
  *{box-sizing:border-box}
  body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;padding:24px;color:#111;background:#fff}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #444;padding:7px 9px;font-size:13px;text-align:left}
  .head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px}
  .logo{width:66px;height:66px;border-radius:10px;object-fit:cover;border:1px solid #ddd}
  .org{flex:1;text-align:center}
  .org-name{font-size:21px;font-weight:800;text-transform:uppercase;letter-spacing:.02em}
  .org-sub{font-size:12px;color:#374151}
  @media print{@page{margin:12mm} body{padding:0}}
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
        `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(title)}</title><style>${BASE}${styles}</style></head><body>${body}</body></html>`
    );
    win.document.close();
    win.focus();
    // Wait for images (logo/photo) before printing; the timeout is a fallback
    // for browsers that already fired load. The flag prevents a double dialog.
    let printed = false;
    const go = () => {
        if (printed) return;
        printed = true;
        win.print();
    };
    win.onload = () => setTimeout(go, 150);
    setTimeout(go, 1200);
}

export function printFeeInvoice(fee: FeeDTO, org: PrintOrg) {
    const styles = `
      .copy{border:1px solid #111;border-radius:10px;padding:16px;margin-bottom:30px;page-break-inside:avoid}
      .copy-title{margin-top:4px;font-weight:700;font-size:13px}
      .meta th{width:170px;background:#f3f4f6}
      .signs{display:flex;justify-content:space-between;gap:24px;margin-top:56px}
      .sign{width:42%;text-align:center;border-top:1px solid #111;padding-top:6px;font-size:13px;font-weight:600}
      .cut{border-top:1px dashed #9ca3af;margin:-14px 0 16px}
    `;
    const copy = (label: string) => `<div class="copy">${header(org, `<div class="copy-title">${label}</div>`)}
      <table class="meta">
        <tr><th>Receipt No</th><td>#${fee.id}</td></tr>
        <tr><th>Student Name</th><td>${esc(fee.studentName)}</td></tr>
        <tr><th>Student ID</th><td>${esc(fee.studentId)}</td></tr>
        <tr><th>Amount</th><td><b>৳ ${Number(fee.amount).toLocaleString("en-IN")}</b></td></tr>
        <tr><th>Deposit By</th><td>${esc(fee.depositBy)}</td></tr>
        <tr><th>Received By</th><td>${esc(fee.receivedBy)}</td></tr>
        <tr><th>Date</th><td>${esc(formatDateTime(fee.createdAt))}</td></tr>
      </table>
      <div class="signs"><div class="sign">Depositor Sign</div><div class="sign">Receiver Sign</div></div></div>`;
    openAndPrint(`Fee Invoice - ${fee.studentName}`, `${copy("Office Copy")}<div class="cut"></div>${copy("Student Copy")}`, styles);
}

export function printMarkSheet(r: ResultDTO, org: PrintOrg, photo?: string | null) {
    const styles = `
      .sheet{max-width:900px;margin:auto;border:1px solid #d1d5db;border-radius:12px;padding:26px 32px}
      .info{display:flex;justify-content:space-between;gap:20px;margin-bottom:12px}
      .info p{margin:3px 0;font-size:14px}
      .photo{width:110px;height:120px;border-radius:10px;border:1px solid #d1d5db;object-fit:cover}
      .title{text-align:center;font-size:19px;font-weight:800;letter-spacing:.08em;margin:16px 0 10px}
      th,td{text-align:center}
      tfoot th{background:#f3f4f6}
      .footer{margin-top:56px;display:flex;justify-content:flex-end}
      .sign{border-top:1px solid #111;padding-top:4px;font-size:14px;font-weight:600;min-width:180px;text-align:center}
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
    const photoHtml = photo ? `<img class="photo" src="${esc(photo)}" alt=""/>` : "";

    const body = `<div class="sheet">${header(org)}
      <div class="info"><div>
        <p><b>Student:</b> ${esc(r.studentName)}</p>
        <p><b>Student ID:</b> ${esc(r.studentId)}</p>
        <p><b>Batch:</b> ${esc(r.batch)}</p>
        <p><b>Result Type:</b> ${esc(r.resultType)}</p>
        <p><b>Exam Date:</b> ${esc(formatDate(r.examDate))}</p>
      </div>${photoHtml}</div>
      <div class="title">MARK SHEET</div>
      <table>
        <thead><tr><th>SL</th><th>Subject</th><th>MCQ (G/T)</th><th>Written (G/T)</th><th>Total (G/T)</th><th>Percentage</th><th>GPA</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><th colspan="4" style="text-align:right">Grand Total</th><th>${r.totalGain}/${r.totalMarks}</th><th>${pct.toFixed(2)}%</th><th>${overall.grade} [${overall.point.toFixed(2)}]</th></tr></tfoot>
      </table>
      <div class="footer"><div class="sign">Director's Signature</div></div></div>`;
    openAndPrint(`Marksheet - ${r.studentName}`, body, styles);
}

export function printStudentProfile(s: StudentDTO, org: PrintOrg) {
    const styles = `
      .card{border:1px solid #e5e7eb;border-radius:12px;padding:22px}
      .who{display:flex;gap:16px;align-items:center;margin:6px 0 18px}
      .avatar{width:90px;height:100px;border-radius:12px;object-fit:cover;border:1px solid #e5e7eb;background:#f3f4f6}
      .name{font-size:20px;font-weight:700}.mono{font-family:ui-monospace,monospace;color:#374151}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px}
      .row{display:flex;gap:8px;font-size:14px}.label{width:140px;color:#6b7280}.val{font-weight:600}
    `;
    const field = (label: string, v: unknown) => `<div class="row"><div class="label">${label}</div><div class="val">${esc(v || "-")}</div></div>`;
    const body = `<div class="card">${header(org, `<div class="org-sub" style="margin-top:4px;font-weight:700">Student Profile</div>`)}
      <div class="who">${s.photoUrl ? `<img class="avatar" src="${esc(s.photoUrl)}" alt=""/>` : `<div class="avatar"></div>`}
        <div><div class="name">${esc(s.name)}</div><div class="mono">${esc(s.studentId)}</div></div></div>
      <div class="grid">
        ${field("Batch", s.batch)}${field("Roll", s.roll)}
        ${field("Group", s.division)}${field("Gender", s.gender)}
        ${field("Birth Date", s.birthDate)}${field("Course Fee", s.courseFee != null ? `৳ ${s.courseFee}` : "")}
        ${field("School Name", s.schoolName)}${field("School Roll", s.schoolRoll)}
        ${field("School Section", s.schoolSection)}${field("Address", s.address)}
        ${field("Father", s.fatherName)}${field("Mother", s.motherName)}
        ${field("Guardian", s.guardianName)}${field("Guardian Phone", s.guardianPhone)}
      </div></div>`;
    openAndPrint(`${s.name} - ${s.studentId}`, body, styles);
}
