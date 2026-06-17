"use client";

import { useState } from "react";
import Link from "next/link";

interface Instruction {
  id: string;
  instruction_id: string;
  transaction_id: string;
  user_id: string;
  leg: string;
  beneficiary_type: string;
  beneficiary_name: string;
  beneficiary_account: string;
  beneficiary_bank: string;
  amount: number;
  currency: string;
  lc_reference: string | null;
  status: string;
  instruction_hash: string | null;
  otp_attestation_hash: string | null;
  otp_verified_at: string | null;
  signature: string | null;
  expires_at: string | null;
  transmitted_at: string | null;
  created_at: string;
}

interface Confirmation {
  id: string;
  instruction_id: string;
  source: string;
  bank: string | null;
  confirmation_reference: string | null;
  document_path: string | null;
  signature_verified: boolean;
  reconciliation_status: string;
  received_at: string;
}

interface LedgerEntry {
  id: string;
  transaction_id: string;
  instruction_id: string | null;
  leg: string | null;
  event_type: string;
  amount: number | null;
  currency: string | null;
  evidence_ref: string | null;
  recorded_at: string;
}

interface Txn {
  id: string;
  transaction_ref: string;
  supplier_name: string;
  user_id: string;
}

interface Props {
  instructions: Instruction[];
  confirmations: Confirmation[];
  ledger: LedgerEntry[];
  transactions: Txn[];
}

const statusColor: Record<string, string> = {
  settled: "text-emerald-400",
  reconciled: "text-emerald-400",
  confirmation_pending: "text-amber-400",
  transmitted: "text-amber-400",
  signed: "text-amber-400",
  otp_verified: "text-amber-400",
  otp_pending: "text-slate-400",
  draft: "text-slate-400",
  rejected: "text-red-400",
  failed: "text-red-400",
  expired: "text-red-400",
};

export default function PaymentsClient({ instructions, confirmations, ledger, transactions }: Props) {
  const [selected, setSelected] = useState<Instruction | null>(null);

  const txnFor = (id: string) => transactions.find((t) => t.id === id);
  const confsFor = (iid: string) => confirmations.filter((c) => c.instruction_id === iid);
  const ledgerFor = (iid: string) => ledger.filter((l) => l.instruction_id === iid);

  return (
    <main style={{ minHeight: "100vh", background: "#080C14", color: "#E8E0D0" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "13px", color: "#8A9AB5", textDecoration: "none" }}>← Staff Home</Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
          <span style={{ fontSize: "13px", color: "#8A9AB5" }}>Payments Monitoring</span>
        </div>
        <span style={{ fontSize: "20px", fontWeight: 900 }}>KY<span style={{ color: "#C9A84C" }}>A</span> Staff</span>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px" }}>
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "4px" }}>Compliance Oversight</p>
          <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0 }}>Payment Instructions</h1>
          <p style={{ fontSize: "13px", color: "#8A9AB5", marginTop: "8px" }}>
            View-only monitoring of all payment instructions. Staff cannot initiate, modify, or action any payment.
          </p>
        </div>

        {/* Read-only banner */}
        <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", color: "#C9A84C", margin: 0 }}>
            This is a monitoring view. KYA staff have no ability to move, approve, or alter funds. All payments are executed by the banks under the customer's authorisation.
          </p>
        </div>

        {instructions.length === 0 ? (
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "48px", textAlign: "center" }}>
            <p style={{ color: "#8A9AB5", fontSize: "14px" }}>No payment instructions yet.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["Instruction", "Transaction", "Supplier", "Amount", "Leg", "Status", ""].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#4A5568", fontFamily: "monospace" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {instructions.map((pi) => {
                  const txn = txnFor(pi.transaction_id);
                  return (
                    <tr key={pi.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px 16px", fontSize: "12px", fontFamily: "monospace", color: "#C9A84C" }}>{pi.instruction_id}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px" }}>{txn?.transaction_ref || "—"}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px" }}>{pi.beneficiary_name}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700 }}>{Number(pi.amount).toLocaleString()} {pi.currency}</td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "#8A9AB5" }}>{pi.leg === "roecny_usd" ? "ROECNY" : "Source"}</td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 600 }} className={statusColor[pi.status] || "text-slate-400"}>{pi.status}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={() => setSelected(pi)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", color: "#8A9AB5", cursor: "pointer" }}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "flex-end", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "560px", maxWidth: "100%", height: "100%", background: "#0D1420", borderLeft: "1px solid rgba(201,168,76,0.2)", overflowY: "auto", padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Instruction Detail</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#8A9AB5", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>

            <p style={{ fontFamily: "monospace", color: "#C9A84C", fontSize: "13px", marginBottom: "20px" }}>{selected.instruction_id}</p>

            {/* Core details */}
            <Section title="Payment">
              <Row label="Status" value={selected.status} />
              <Row label="Leg" value={selected.leg === "roecny_usd" ? "ROECNY (USD/RMB)" : "Source (NGN)"} />
              <Row label="Amount" value={Number(selected.amount).toLocaleString() + " " + selected.currency} />
              <Row label="LC Reference" value={selected.lc_reference || "—"} />
            </Section>

            <Section title="Frozen Beneficiary">
              <Row label="Name" value={selected.beneficiary_name} />
              <Row label="Bank" value={selected.beneficiary_bank} />
              <Row label="Account" value={selected.beneficiary_account} />
              <Row label="Type" value={selected.beneficiary_type} />
              <Row label="Frozen" value={selected.beneficiary_type === "lc_supplier" ? "LC-tied supplier" : "AD-nominated"} />
            </Section>

            <Section title="Authentication">
              <Row label="OTP Verified" value={selected.otp_verified_at ? new Date(selected.otp_verified_at).toLocaleString("en-GB") : "—"} />
              <Row label="Attestation" value={selected.otp_attestation_hash ? selected.otp_attestation_hash.slice(0, 24) + "…" : "—"} mono />
              <Row label="Signature" value={selected.signature ? selected.signature.slice(0, 24) + "…" : "—"} mono />
              <Row label="Instruction Hash" value={selected.instruction_hash ? selected.instruction_hash.slice(0, 24) + "…" : "—"} mono />
              <Row label="Transmitted" value={selected.transmitted_at ? new Date(selected.transmitted_at).toLocaleString("en-GB") : "—"} />
            </Section>

            {/* Reconciliation */}
            <Section title="Reconciliation">
              {confsFor(selected.instruction_id).length === 0 ? (
                <p style={{ fontSize: "13px", color: "#8A9AB5" }}>No confirmations yet.</p>
              ) : (
                confsFor(selected.instruction_id).map((c) => (
                  <div key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "10px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", color: "#E8E0D0" }}>{c.source === "bank_notification" ? "Bank notification (" + (c.bank || "") + ")" : "Customer upload"}</span>
                      <span style={{ fontSize: "12px", color: c.reconciliation_status === "matched" ? "#10b981" : "#C9A84C" }}>{c.reconciliation_status}</span>
                    </div>
                    {c.confirmation_reference && <p style={{ fontSize: "11px", color: "#4A5568", margin: "4px 0 0" }}>Ref: {c.confirmation_reference}</p>}
                    {c.source === "bank_notification" && <p style={{ fontSize: "11px", color: c.signature_verified ? "#10b981" : "#ef4444", margin: "4px 0 0" }}>{c.signature_verified ? "✓ Signature verified" : "✗ Signature not verified"}</p>}
                    <p style={{ fontSize: "11px", color: "#4A5568", margin: "4px 0 0" }}>{new Date(c.received_at).toLocaleString("en-GB")}</p>
                  </div>
                ))
              )}
            </Section>

            {/* Ledger timeline */}
            <Section title="Settlement Ledger">
              {ledgerFor(selected.instruction_id).length === 0 ? (
                <p style={{ fontSize: "13px", color: "#8A9AB5" }}>No ledger entries.</p>
              ) : (
                <div style={{ position: "relative" }}>
                  {ledgerFor(selected.instruction_id).map((l) => (
                    <div key={l.id} style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C9A84C", marginTop: "5px", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", color: "#E8E0D0", margin: 0 }}>{l.event_type}</p>
                        <p style={{ fontSize: "11px", color: "#4A5568", margin: "2px 0 0" }}>{new Date(l.recorded_at).toLocaleString("en-GB")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "10px" }}>{title}</p>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "4px 16px" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: "12px", color: "#4A5568" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#E8E0D0", fontFamily: mono ? "monospace" : "inherit", textAlign: "right", maxWidth: "320px", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}