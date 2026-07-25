// Document generation via the browser's print engine. Opens a branded print
// window; the user's "Save as PDF" produces a real PDF — no external library.

const DOC_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter','Segoe UI',Roboto,Arial,sans-serif; color: #0f172a; padding: 40px 44px; font-size: 12px; line-height: 1.5; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6C4CE1; padding-bottom: 16px; margin-bottom: 22px; }
  .brand { font-size: 20px; font-weight: 800; color: #2D1B69; letter-spacing: -0.3px; }
  .brand small { display:block; font-size: 10px; font-weight: 600; color: #6C4CE1; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
  .doc-meta { text-align: right; font-size: 11px; color: #475569; }
  .doc-title { font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
  .doc-num { color: #6C4CE1; font-weight: 700; margin-top: 2px; }
  .cols { display: flex; gap: 40px; margin: 20px 0; }
  .col { flex: 1; }
  .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 4px; }
  .val { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 18px 0; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; border-bottom: 2px solid #e2e8f0; padding: 8px 10px; }
  td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
  td.r, th.r { text-align: right; }
  .totals { width: 280px; margin-left: auto; margin-top: 8px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 10px; }
  .totals .grand { border-top: 2px solid #0f172a; font-weight: 800; font-size: 14px; margin-top: 4px; }
  .stamp { display:inline-block; margin-top: 6px; padding: 4px 12px; border: 2px solid #10b981; color: #059669; font-weight: 800; letter-spacing: 1px; border-radius: 6px; transform: rotate(-4deg); }
  .body-text { margin: 16px 0; line-height: 1.7; }
  .sign { display: flex; gap: 60px; margin-top: 48px; }
  .sign .line { flex: 1; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; color: #64748b; }
  .foot { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } }
`;

export function printDocument(title: string, inner: string): void {
  const w = window.open('', '_blank', 'width=860,height=1100');
  if (!w) { alert('Please allow pop-ups to generate the document.'); return; }
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>` +
    `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">` +
    `<style>${DOC_CSS}</style></head><body>${inner}` +
    `<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script></body></html>`
  );
  w.document.close();
}

function esc(s: string | number | undefined | null): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
const money = (n: number, cur = 'USD') => `${cur} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const head = (org: string, meta: string) =>
  `<div class="head"><div class="brand">${esc(org)}<small>Maritime Agency</small></div><div class="doc-meta">${meta}</div></div>`;

// ------------------------------------------------------------ Invoice / Receipt
export interface InvoiceDoc {
  orgName: string;
  kind: 'invoice' | 'receipt';
  number: string;
  billTo: string;
  issueDate: string;
  dueDate?: string;
  currency?: string;
  lineItems: { description: string; amount: number }[];
  notes?: string;
}

export function invoiceHtml(d: InvoiceDoc): string {
  const cur = d.currency || 'USD';
  const total = d.lineItems.reduce((s, i) => s + (i.amount || 0), 0);
  const receipt = d.kind === 'receipt';
  const rows = d.lineItems.map((i) => `<tr><td>${esc(i.description)}</td><td class="r">${money(i.amount, cur)}</td></tr>`).join('');
  return (
    head(d.orgName, `<div class="doc-title">${receipt ? 'Receipt' : 'Invoice'}</div><div class="doc-num">${esc(d.number)}</div>`) +
    `<div class="cols">
       <div class="col"><div class="label">Bill To</div><div class="val">${esc(d.billTo || '—')}</div></div>
       <div class="col" style="text-align:right">
         <div class="label">Issue date</div><div class="val">${esc((d.issueDate || '').slice(0, 10))}</div>
         ${d.dueDate ? `<div class="label" style="margin-top:8px">Due date</div><div class="val">${esc(d.dueDate.slice(0, 10))}</div>` : ''}
       </div>
     </div>` +
    `<table><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<div class="totals"><div class="row grand"><span>Total</span><span>${money(total, cur)}</span></div>
       ${receipt ? '<div style="text-align:right"><span class="stamp">PAID</span></div>' : ''}</div>` +
    (d.notes ? `<div class="body-text"><div class="label">Notes</div>${esc(d.notes)}</div>` : '') +
    `<div class="foot">Generated by OnePort · ${new Date().toLocaleString()}</div>`
  );
}

// ------------------------------------------------------------ Letter of Readiness
export function lorHtml(d: NorDoc): string {
  const when = new Date(d.tenderedAt);
  const dateStr = when.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    head(d.orgName, `<div class="doc-title">Letter of Readiness</div><div class="doc-num">${esc(d.voyageNumber)}</div>`) +
    `<div class="cols">
       <div class="col"><div class="label">Vessel</div><div class="val">${esc(d.vesselName)}${d.imoNumber ? ` (IMO ${esc(d.imoNumber)})` : ''}</div></div>
       <div class="col"><div class="label">Port</div><div class="val">${esc(d.port)}${d.place ? `, ${esc(d.place)}` : ''}</div></div>
     </div>` +
    `<div class="body-text">To: <strong>${esc(d.addressedTo)}</strong></div>
     <div class="body-text">Dear Sirs,</div>
     <div class="body-text"><strong>RE: LETTER OF READINESS — ${esc(d.vesselName)}</strong></div>
     <div class="body-text">This is to certify that the above-named vessel has arrived at the port of <strong>${esc(d.port)}</strong> and is in every respect ready — with holds/tanks clean, gear and equipment in good working order — to commence <strong>${d.operation}</strong> of the cargo (${esc(d.cargo)}${d.quantity ? `, ${Number(d.quantity).toLocaleString()} MT` : ''}).</div>
     <div class="body-text">Issued at ${esc(d.port)} on <strong>${dateStr}</strong> at <strong>${timeStr}</strong> local time.</div>` +
    `<div class="sign">
       <div class="line">Master / Authorised Officer — ${esc(d.vesselName)}</div>
       <div class="line">For and on behalf of ${esc(d.orgName)} (Agents)</div>
     </div>` +
    `<div class="foot">Generated by OnePort · ${new Date().toLocaleString()}</div>`
  );
}

// ------------------------------------------------------------ Disbursement Account (PDA/FDA)
export interface DisbursementDoc {
  orgName: string;
  kind: 'PDA' | 'FDA';
  voyageNumber: string;
  vesselName: string;
  principal?: string;
  currency?: string;
  date?: string;
  items: { category: string; description?: string; estimated: number; actual: number; status?: string }[];
}

export function disbursementHtml(d: DisbursementDoc): string {
  const cur = d.currency || 'USD';
  const final = d.kind === 'FDA';
  const totEst = d.items.reduce((s, i) => s + (i.estimated || 0), 0);
  const totAct = d.items.reduce((s, i) => s + (i.actual || 0), 0);
  const rows = d.items.map((i) => `<tr>
      <td><strong>${esc(i.category)}</strong>${i.description ? `<br><span style="color:#94a3b8;font-size:10px">${esc(i.description)}</span>` : ''}</td>
      <td class="r">${money(i.estimated, cur)}</td>
      ${final ? `<td class="r">${money(i.actual, cur)}</td>` : ''}
      <td style="text-align:center">${esc(i.status || '')}</td>
    </tr>`).join('');
  return (
    head(d.orgName, `<div class="doc-title">${final ? 'Final' : 'Proforma'} Disbursement A/C</div><div class="doc-num">${esc(d.voyageNumber)}</div>`) +
    `<div class="cols">
       <div class="col"><div class="label">Vessel</div><div class="val">${esc(d.vesselName)}</div></div>
       <div class="col"><div class="label">Principal</div><div class="val">${esc(d.principal || '—')}</div></div>
       <div class="col" style="text-align:right"><div class="label">Date</div><div class="val">${esc((d.date || new Date().toISOString()).slice(0, 10))}</div></div>
     </div>` +
    `<table><thead><tr><th>Item</th><th class="r">Estimated</th>${final ? '<th class="r">Actual</th>' : ''}<th style="text-align:center">Status</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<div class="totals">
       <div class="row"><span>Total estimated</span><span>${money(totEst, cur)}</span></div>
       ${final ? `<div class="row"><span>Total actual</span><span>${money(totAct, cur)}</span></div>
       <div class="row grand"><span>Variance</span><span>${money(totAct - totEst, cur)}</span></div>` : `<div class="row grand"><span>Proforma total</span><span>${money(totEst, cur)}</span></div>`}
     </div>` +
    `<div class="body-text" style="font-size:10px;color:#94a3b8">${final ? 'Final Disbursement Account — actual costs incurred against the proforma estimate.' : 'Proforma Disbursement Account — estimated port costs, subject to final reconciliation (FDA).'}</div>` +
    `<div class="foot">Generated by OnePort · ${new Date().toLocaleString()}</div>`
  );
}

// ------------------------------------------------------------ Operational report (Reports & Analytics)
export interface OpsReportDoc {
  orgName: string;
  orgAddress?: string;
  title: string;      // e.g. 'Arrival Clearance Report'
  reference: string;  // e.g. RPT-0126-20260725
  vesselRows: [string, string][];
  sections: {
    heading: string;
    paragraphs?: string[];
    rows?: [string, string][];
    table?: { head: string[]; rows: string[][] };
  }[];
  signedBy?: string; // omitted = unsigned line
}

export function opsReportHtml(d: OpsReportDoc): string {
  const rowGrid = (rows: [string, string][]) =>
    `<div style="display:flex;flex-wrap:wrap;gap:14px 40px;margin:10px 0">` +
    rows.map(([l, v]) => `<div style="min-width:180px"><div class="label">${esc(l)}</div><div class="val">${esc(v)}</div></div>`).join('') +
    `</div>`;
  const sections = d.sections.map((s) =>
    `<div style="margin-top:22px"><div class="label" style="font-size:10px;color:#6C4CE1;border-bottom:1px solid #e2e8f0;padding-bottom:4px">${esc(s.heading)}</div>` +
    (s.paragraphs || []).map((p) => `<div class="body-text">${esc(p)}</div>`).join('') +
    (s.rows ? rowGrid(s.rows) : '') +
    (s.table
      ? `<table><thead><tr>${s.table.head.map((h, i) => `<th${i > 0 ? ' class="r"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>` +
        s.table.rows.map((r) => `<tr>${r.map((c, i) => `<td${i > 0 ? ' class="r"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('') +
        `</tbody></table>`
      : '') +
    `</div>`
  ).join('');
  return (
    head(d.orgName, `<div class="doc-title">${esc(d.title)}</div><div class="doc-num">${esc(d.reference)}</div><div>${esc(new Date().toLocaleDateString())}</div>`) +
    (d.orgAddress ? `<div style="font-size:10px;color:#94a3b8;margin:-14px 0 14px">${esc(d.orgAddress)}</div>` : '') +
    rowGrid(d.vesselRows) +
    sections +
    `<div class="sign">
       <div class="line">${d.signedBy ? `Electronically signed — ${esc(d.signedBy)}` : 'Sign-off — pending'}</div>
       <div class="line">For and on behalf of ${esc(d.orgName)} (Agents)</div>
     </div>` +
    `<div class="foot">Generated by OnePort · ${new Date().toLocaleString()}</div>`
  );
}

// ------------------------------------------------------------ Notice of Readiness
export interface NorDoc {
  orgName: string;
  vesselName: string;
  imoNumber?: string;
  voyageNumber: string;
  port: string;
  place?: string;
  cargo: string;
  quantity?: number;
  operation: 'loading' | 'discharging';
  tenderedAt: string; // ISO
  addressedTo: string;
  agentName?: string;
}

export function norHtml(d: NorDoc): string {
  const when = new Date(d.tenderedAt);
  const dateStr = when.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    head(d.orgName, `<div class="doc-title">Notice of Readiness</div><div class="doc-num">${esc(d.voyageNumber)}</div>`) +
    `<div class="cols">
       <div class="col"><div class="label">Vessel</div><div class="val">${esc(d.vesselName)}${d.imoNumber ? ` (IMO ${esc(d.imoNumber)})` : ''}</div></div>
       <div class="col"><div class="label">Port</div><div class="val">${esc(d.port)}${d.place ? `, ${esc(d.place)}` : ''}</div></div>
     </div>
     <div class="cols">
       <div class="col"><div class="label">Cargo</div><div class="val">${esc(d.cargo)}${d.quantity ? ` — ${Number(d.quantity).toLocaleString()} MT` : ''}</div></div>
       <div class="col"><div class="label">Tendered</div><div class="val">${dateStr} at ${timeStr}</div></div>
     </div>` +
    `<div class="body-text">To: <strong>${esc(d.addressedTo)}</strong></div>
     <div class="body-text">Dear Sirs,</div>
     <div class="body-text">Please be advised that the <strong>${esc(d.vesselName)}</strong> has arrived at <strong>${esc(d.port)}</strong> and is in all respects <strong>ready to commence ${d.operation}</strong> of the cargo (${esc(d.cargo)}), whether in berth or not, whether in free pratique or not, whether customs cleared or not.</div>
     <div class="body-text">This Notice of Readiness is hereby tendered on <strong>${dateStr}</strong> at <strong>${timeStr}</strong> local time, and laytime is to commence in accordance with the governing charter party terms.</div>` +
    `<div class="sign">
       <div class="line">Tendered by — ${esc(d.agentName || d.orgName)} (Agents)</div>
       <div class="line">Acknowledged by — Master / Receivers</div>
     </div>` +
    `<div class="foot">Generated by OnePort · ${new Date().toLocaleString()}</div>`
  );
}
