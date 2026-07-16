import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

/* ── Inline SVG Icons ─────────────────────────────────────── */
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>
  </svg>
);
const IconKey = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

/* ── StatusPill helper ────────────────────────────────────── */
function StatusPill({ status }) {
  const map = {
    approved:      'pill-approved',
    pending:       'pill-pending',
    pending_vendor:'pill-pending_vendor',
    pending_ceva:  'pill-pending_ceva',
    rejected:      'pill-rejected',
  };
  const label = {
    approved: 'Approved', pending: 'Pending',
    pending_vendor: 'Vendor Review', pending_ceva: 'Ceva Review', rejected: 'Rejected',
  };
  return <span className={`status-pill ${map[status] || 'pill-pending'}`}>{label[status] || status}</span>;
}

/* ── 2FA Modal ────────────────────────────────────────────── */
function TwoFAModal({ smsCode, onVerify, onCancel }) {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputCode === smsCode) { onVerify(); }
    else { setError('Incorrect code. Check the simulated SMS above and try again.'); }
  };
  return (
    <div className="modal-overlay">
      <div className="modal-box slide-in">
        <div>
          <div className="modal-title">Two-Factor Authentication</div>
          <div className="modal-desc" style={{ marginTop: 6 }}>
            CEVA Admin authorization requires 2FA to approve vendor onboarding. Enter the code below.
          </div>
        </div>
        <div>
          <div className="modal-code-display">{smsCode}</div>
          <div className="modal-code-label">Simulated SMS Code</div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="modal-otp-input"
            type="text"
            maxLength={4}
            placeholder="----"
            value={inputCode}
            onChange={e => { setInputCode(e.target.value); setError(''); }}
            required
            autoFocus
          />
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-actions">
            <button type="submit" className="btn-modal-confirm">Verify & Approve</button>
            <button type="button" className="btn-modal-cancel" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────── */
function PassDetailsModal({ pass, onClose, workers, supervisors, companies, passes }) {
  if (!pass) return null;
  const company = companies.find(c => c.id === pass.companyId);
  const relatedPasses = passes ? passes.filter(p => 
    p.companyId === pass.companyId &&
    p.supervisorName === pass.supervisorName &&
    p.zoneLevel === pass.zoneLevel &&
    p.startDate === pass.startDate &&
    p.endDate === pass.endDate &&
    p.startTime === pass.startTime &&
    p.endTime === pass.endTime &&
    p.purpose === pass.purpose &&
    p.status === pass.status
  ) : [pass];
  const firstWorker = workers.find(w => w.id === pass.workerId);
  const supervisor = supervisors.find(s => s.name === pass.supervisorName || (firstWorker && s.name === firstWorker.supervisorName));

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-box slide-in" style={{ maxWidth: 620 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
          <div className="modal-title" style={{ margin: 0 }}>Gate Pass Clearance Details</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>&times;</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
          {/* Pass Info */}
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pass ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#0f172a' }}>
                {relatedPasses.length > 1 ? `[Batch: ${relatedPasses.length} Passes]` : `#${pass.id}`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Access Zone</div>
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}><span className="zone-badge">{pass.zoneLevel}</span></div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Validity Range</div>
              <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>{pass.startDate} to {pass.endDate}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Shift Window</div>
              <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>{pass.startTime} – {pass.endTime}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Purpose of Visit</div>
              <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>{pass.purpose || 'Not specified'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Worker Column */}
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ceva-blue)', fontWeight: 600, borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 8 }}>
                Worker Profile{relatedPasses.length > 1 ? `s (${relatedPasses.length})` : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '160px', overflowY: 'auto', paddingRight: 4 }}>
                {relatedPasses.map(rp => {
                  const rWorker = workers.find(w => w.id === rp.workerId);
                  if (!rWorker) return null;
                  return (
                    <div key={rp.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {rWorker.photo ? (
                        <img src={rWorker.photo} alt={rWorker.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>{rWorker.name?.[0]}</div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{rWorker.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{rWorker.email} | {rWorker.phone}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supervisor Column */}
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ceva-blue)', fontWeight: 600, borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 8 }}>Assigned Supervisor</div>
              {supervisor ? (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{supervisor.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{supervisor.email}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{supervisor.phone || 'No phone recorded'}</div>
                  <div style={{ marginTop: 4 }}><StatusPill status={supervisor.status} /></div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{pass.supervisorName || worker?.supervisorName || 'Unknown'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#ef4444', fontStyle: 'italic', marginTop: 4 }}>Supervisor profile not registered in database.</div>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Status */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: 8 }}>Verification Workflow Progress</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <span style={{ height: 8, width: 8, borderRadius: '50%', background: (pass.status !== 'pending_vendor') ? '#10b981' : '#f59e0b' }} />
                <span>Step 1 (Vendor Review): <strong>{pass.status === 'pending_vendor' ? 'Pending' : 'Verified'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <span style={{ height: 8, width: 8, borderRadius: '50%', background: (pass.status === 'approved') ? '#10b981' : (pass.status === 'rejected') ? '#ef4444' : '#f59e0b' }} />
                <span>Step 2 (Ceva Vetting): <strong>{pass.status === 'approved' ? 'Approved' : pass.status === 'rejected' ? 'Denied' : 'Awaiting Ceva'}</strong></span>
              </div>
            </div>
          </div>

          {/* HMAC QR Signature (If approved) */}
          {pass.status === 'approved' && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>SHA-256 HMAC Signature</div>
              <div className="sig-box" style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                {pass.qr_secure_signature || 'Signed server-side'}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '8px 16px' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function CompanyDetailsModal({ company, onClose, companies }) {
  if (!company) return null;
  const parent = companies.find(p => p.id === company.parentCompanyId);

  // Compile active certifications
  const certs = [];
  if (company.iso9001) certs.push("ISO 9001");
  if (company.iso28000) certs.push("ISO 28000 (Supply Chain Security)");
  if (company.tapaTsr) certs.push("TAPA TSR (Truck Security)");
  if (company.ctpat) certs.push("C-TPAT / AEO");
  if (company.gdpPharma) certs.push("GDP / GDPMD (Pharma)");

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-box slide-in" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
          <div className="modal-title" style={{ margin: 0 }}>Company Profile & Compliance Vetting</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>{company.name}</div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 600, color: 'var(--ceva-blue)', marginTop: 4 }}>{company.type}</div>
            <div style={{ marginTop: 6 }}><StatusPill status={company.status} /></div>
          </div>

          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            <div>
              <strong style={{ color: '#64748b' }}>Contact Email:</strong> {company.email}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>Phone Number:</strong> {company.phone}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>Hierarchy Routing:</strong> {parent ? `Linked to Partner: ${parent.name}` : 'Direct CEVA Relationship'}
            </div>
            
            <div style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }} />
            
            <div>
              <strong style={{ color: '#64748b' }}>Corporate Registry Type:</strong> {company.bizRegType || 'SSM (Malaysia)'}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>Tax ID / Business Reg #:</strong> {company.taxId || 'N/A'}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>DUNS Number:</strong> {company.dunsNumber || 'N/A'}
            </div>
            {company.customsLicense && (
              <div>
                <strong style={{ color: '#64748b' }}>Customs License ID:</strong> {company.customsLicense}
              </div>
            )}

            {company.type === 'trucking' && (
              <>
                <div style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }} />
                <div>
                  <strong style={{ color: '#64748b' }}>US DOT / MC Number:</strong> {company.dotNumber || 'N/A'}
                </div>
                <div>
                  <strong style={{ color: '#64748b' }}>GPS Tracking Status:</strong> {company.gpsEquipped === 'yes' ? '✅ Equipped & Active (APAD Compliant)' : '❌ Not Equipped'}
                </div>
              </>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }} />
            
            <div>
              <strong style={{ color: '#64748b' }}>Cargo Insurance Policy:</strong> {company.insurancePolicy ? `${company.insurancePolicy} (Limit: ${company.insuranceAmount || 'N/A'})` : 'No cargo policy on file'}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>Public Liability Limit:</strong> {company.publicLiabilityLimit || 'N/A'}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }} />
            
            <div>
              <strong style={{ color: '#64748b' }}>Safety Certifications:</strong>
              {certs.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {certs.map(c => <span key={c} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>{c}</span>)}
                </div>
              ) : (
                <span style={{ marginLeft: 4, color: '#94a3b8' }}>None declared</span>
              )}
            </div>

            <div>
              <strong style={{ color: '#64748b' }}>Headquarters Address:</strong> {company.physicalAddress || 'N/A'}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>Submitted Date:</strong> {company.createdAt || 'N/A'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '10px 20px', width: 'auto', margin: 0, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function TableImage({ src, fallbackEmoji, alt }) {
  const [error, setError] = React.useState(false);
  
  if (error || !src) {
    return (
      <div style={{ 
        width: '40px', 
        height: '40px', 
        borderRadius: '6px', 
        background: '#f8fafc', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '1rem',
        border: '1.5px dashed #cbd5e1',
        boxSizing: 'border-box'
      }}>
        {fallbackEmoji}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt}
      onError={() => setError(true)}
      style={{ 
        width: '40px', 
        height: '40px', 
        borderRadius: '6px', 
        objectFit: 'cover', 
        border: '1.5px solid #cbd5e1',
        display: 'block',
        boxSizing: 'border-box'
      }} 
    />
  );
}

export default function CevaAdminDashboard({ view }) {
  const {
    companies, verifyCompany,
    passes, approvePassCeva, approvePassCevaBulk, workers, trucks, drivers,
    activeHeadcount, activeTruckHeadcount, logs, alerts, resolveAlert, deliveries = [], supervisors = []
  } = useSystem();

  const [pending2FAId, setPending2FAId] = useState(null);
  const [smsCode,      setSmsCode]      = useState('');
  const [selectedPass,  setSelectedPass]  = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const trigger2FA = (companyId) => {
    setSmsCode(Math.floor(1000 + Math.random() * 9000).toString());
    setPending2FAId(companyId);
  };

  const handle2FAVerify = () => {
    verifyCompany(pending2FAId, true);
    setPending2FAId(null);
  };

  /* Derived data */
  const pendingVendors    = companies.filter(c => c.status === 'pending' || c.status === 'pending_ceva');
  const approvedVendors   = companies.filter(c => c.status === 'approved');
  const pendingPasses     = passes.filter(p => p.status === 'pending_ceva');
  const approvedPasses    = passes.filter(p => p.status === 'approved');
  const activePasses      = passes.filter(p => p.checkedIn && !p.checkedOut);
  const activeAlerts      = alerts.filter(a => !a.resolved);
  const recentLogs        = logs.slice(0, 30);
  const tmsLogs           = logs.filter(l => l.type === 'truck').slice(0, 30);

  return (
    <>
      {pending2FAId && (
        <TwoFAModal
          smsCode={smsCode}
          onVerify={handle2FAVerify}
          onCancel={() => setPending2FAId(null)}
        />
      )}

      {/* Page header */}
      <div className="page-header">
        <div className="page-title-block">
          <div className="page-title">VMS Admin Command Center</div>
          <div className="page-subtitle">Vendor onboarding approvals, gate pass control, and live facility monitoring</div>
        </div>
        <span className="page-header-badge badge-ceva">Ceva Admin Portal</span>
      </div>

      {/* Stats Row */}
      {view !== 'cargo' ? (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon blue"><IconUsers /></div>
            <div className="stat-body">
              <div className="stat-value">{activeHeadcount}</div>
              <div className="stat-label">Active On-Site</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><IconCheck /></div>
            <div className="stat-body">
              <div className="stat-value">{approvedVendors.length}</div>
              <div className="stat-label">Verified Vendors</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber"><IconAlert /></div>
            <div className="stat-body">
              <div className="stat-value">{pendingVendors.length}</div>
              <div className="stat-label">Pending Onboardings</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><IconKey /></div>
            <div className="stat-body">
              <div className="stat-value">{approvedPasses.length}</div>
              <div className="stat-label">Issued Passes</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="stats-row cols-3" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 3h15v13H1V3zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
            </div>
            <div className="stat-body">
              <div className="stat-value">{activeTruckHeadcount}</div>
              <div className="stat-label">Active Trucks On-Site</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div className="stat-body">
              <div className="stat-value">{companies.filter(c => c.type === 'trucking' && c.status === 'approved').length}</div>
              <div className="stat-label">Approved 3PL Partners</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
            </div>
            <div className="stat-body">
              <div className="stat-value">{companies.filter(c => c.type === 'trucking' && c.status === 'pending_ceva').length}</div>
              <div className="stat-label">Pending Carrier Approvals</div>
            </div>
          </div>
        </div>
      )}

      {/* Active Security Alerts */}
      {activeAlerts.length > 0 && (
        <div className="alert-banner" style={{ marginBottom: 20 }}>
          <div className="alert-banner-label pulse-text">Critical Security Alerts ({activeAlerts.length})</div>
          {activeAlerts.map(a => (
            <div key={a.id} className="alert-item">
              <div>
                <div className="alert-item-text">{a.message}</div>
                <div className="alert-item-time">Triggered: {a.timestamp}</div>
              </div>
              <button className="btn-action btn-reject" style={{ whiteSpace: 'nowrap' }}
                onClick={() => resolveAlert(a.id)}>Acknowledge</button>
            </div>
          ))}
        </div>
      )}

      {/* Two-column grid */}
      <div className="content-grid">
        {/* Left column / Main Panel */}
        <div style={{ gridColumn: view === 'cargo' ? 'span 2' : undefined }}>
          {/* VIEW: dashboard (Operations Monitor Logs) */}
          {(!view || view === 'dashboard') && (
            <div className="log-console-panel">
              <div className="log-console-header">
                <div className="log-live-dot" />
                <span className="log-console-label">Security Gate Entry Log (All Activity)</span>
              </div>
              <div className="log-console-body" style={{ height: 420 }}>
                {recentLogs.length === 0
                  ? <div className="log-empty">No gate log events recorded yet.</div>
                  : recentLogs.map(log => (
                      <div key={log.id} className="log-line">
                        <span className="log-ts">[{log.timestamp}]</span>
                        <span className={log.action === 'check_in' ? 'log-entry-text' : 'log-exit-text'}>
                          {log.action === 'check_in' ? 'ENTRY' : 'EXIT'}
                        </span>
                        <span className="log-name">{log.workerName}</span>
                        <span className="log-ts">({log.companyName})</span>
                      </div>
                    ))
                }
              </div>
            </div>
          )}

          {/* VIEW: onboarding (Vendor Onboarding Requests) */}
          {view === 'onboarding' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Pending Partner Onboardings</span>
                <span className="panel-badge">{pendingVendors.length} Awaiting</span>
              </div>
              {pendingVendors.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-title">No Pending Onboardings</div>
                    <div className="empty-state-desc">All registration applications have been approved or rejected.</div>
                  </div>
                </div>
              ) : (
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Contact info</th>
                        <th>Hierarchy Routing</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingVendors.map(c => {
                        const parent = companies.find(p => p.id === c.parentCompanyId);
                        return (
                          <tr key={c.id}>
                            <td>
                              <div className="cell-primary">{c.name}</div>
                              <div className="cell-secondary" style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>{c.type}</div>
                            </td>
                            <td>
                              <div className="cell-secondary">{c.email}</div>
                              <div className="cell-secondary">{c.phone}</div>
                            </td>
                            <td>
                              <div className="cell-secondary">
                                {parent ? `Linked to Partner: ${parent.name}` : 'Direct CEVA Relationship'}
                              </div>
                            </td>
                            <td>
                              <div className="actions-cell">
                                <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedCompany(c)}>View Details</button>
                                <button className="btn-action btn-verify" onClick={() => trigger2FA(c.id)}>2FA Verify</button>
                                <button className="btn-action btn-reject" onClick={() => verifyCompany(c.id, false)}>Reject</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: cargo (Live Cargo Dock dispatches) */}
          {view === 'cargo' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Active Logistics Dock Manifests</span>
                <span className="panel-badge">{deliveries.length} manifest(s)</span>
              </div>
              {deliveries.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-title">No Active Dock Manifests</div>
                    <div className="empty-state-desc">No incoming pickup or dropoff dispatches are currently active.</div>
                  </div>
                </div>
              ) : (
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Truck License [Plate]</th>
                        <th>Driver CDL Details</th>
                        <th>Security Seal ID</th>
                        <th>Destination Facility</th>
                        <th>Photos (Container / Seal)</th>
                        <th>Cargo Manifest</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map(d => {
                        const truck = trucks.find(t => t.id === d.truckId);
                        const driver = drivers.find(drv => drv.id === d.driverId);
                        return (
                          <tr key={d.id}>
                            <td><div className="cell-mono cell-secondary" style={{ fontSize: '0.72rem' }}>#{d.id.slice(-6)}</div></td>
                            <td>
                              <div className="cell-primary" style={{ fontSize: '0.82rem' }}>{truck?.plate || 'OCR Error'}</div>
                              <div className="cell-secondary" style={{ fontSize: '0.72rem' }}>{truck?.model}</div>
                            </td>
                            <td>
                              <div className="cell-primary" style={{ fontSize: '0.82rem' }}>{driver?.name || 'Unknown'}</div>
                              <div className="cell-secondary" style={{ fontSize: '0.72rem' }}>Lic: {driver?.license}</div>
                            </td>
                            <td>
                              <div className="sig-label" style={{ fontSize: '0.65rem' }}>SEAL ID</div>
                              <div className="cell-mono cell-secondary" style={{ fontSize: '0.75rem' }}>{d.sealNumber}</div>
                            </td>
                            <td>
                              <div className="cell-primary" style={{ fontSize: '0.82rem' }}>{d.destinationFacility || 'CEVA Hub - Dock A'}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <TableImage src={d.containerPhoto} fallbackEmoji="🚛" alt="Container" />
                                <TableImage src={d.baselineSealPhoto} fallbackEmoji="🔒" alt="Seal" />
                              </div>
                            </td>
                            <td><div className="cell-secondary" style={{ fontSize: '0.78rem' }}>{d.items}</div></td>
                            <td><StatusPill status={d.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === 'cargo' && (
            <div className="log-console-panel" style={{ marginTop: 20 }}>
              <div className="log-console-header">
                <div className="log-live-dot" />
                <span className="log-console-label">Cargo Gate Inspection Log</span>
              </div>
              <div className="log-console-body" style={{ height: 320 }}>
                {tmsLogs.length === 0
                  ? <div className="log-empty">No cargo log events recorded yet.</div>
                  : tmsLogs.map(log => (
                      <div key={log.id} className="log-line">
                        <span className="log-ts">[{log.timestamp}]</span>
                        <span className={log.action === 'check_in' ? 'log-entry-text' : 'log-exit-text'}>
                          {log.action === 'check_in' ? 'CHECK-IN' : 'CHECK-OUT'}
                        </span>
                        <span className="log-name">{log.workerName}</span>
                      </div>
                    ))
                }
              </div>
            </div>
          )}

          {view === 'cargo' && (
            <div className="panel" style={{ marginTop: 20 }}>
              <div className="panel-header">
                <span className="panel-title">Incidents & Security Violations Log</span>
              </div>
              <div className="panel-body" style={{ padding: 20 }}>
                {alerts.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-title">Facility Violation Log Clear</div>
                    <div className="empty-state-desc">All visitor shift times and logistics schedules are operating normally.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {alerts.map(a => (
                      <div key={a.id} style={{
                        padding: 12, borderLeft: '3.5px solid var(--ceva-orange)',
                        background: '#f8fafc', borderRadius: 6,
                        fontSize: '0.83rem', color: '#334155'
                      }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{a.type.toUpperCase()} ALERT</div>
                        <div>{a.message}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>Triggered: {a.timestamp} | Status: {a.resolved ? 'Resolved' : 'Active'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column / Info & Side Panels */}
        <div>
          {/* VIEW: dashboard (Live Checked-in Visitors) */}
          {(!view || view === 'dashboard') && (
            <>
              <div className="panel" style={{ marginBottom: 20 }}>
                <div className="panel-header">
                  <span className="panel-title">Active Visitors On-Site</span>
                  <span className="panel-badge">{activePasses.length} Checked In</span>
                </div>
                <div className="panel-body-flush">
                  {activePasses.length === 0 ? (
                    <div className="panel-body">
                      <div className="empty-state">
                        <div className="empty-state-title">Facility Secure & Clear</div>
                        <div className="empty-state-desc">No external visitors are currently logged inside the security zones.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="live-list" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {activePasses.map(p => {
                        const worker = workers.find(w => w.id === p.workerId);
                        const vendor = companies.find(c => c.id === p.companyId);
                        return (
                          <div key={p.id} className="live-list-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="live-dot" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="cell-primary" style={{ fontSize: '0.85rem' }}>{worker?.name || 'Unknown'}</div>
                              <div className="cell-secondary" style={{ fontSize: '0.75rem' }}>{vendor?.name} · Zone: {p.zoneLevel}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Security Alerts Widget */}
              <div className="panel" style={{ 
                borderLeft: activeAlerts.length > 0 ? '4px solid #ef4444' : undefined,
                boxShadow: activeAlerts.length > 0 ? '0 4px 12px rgba(239, 68, 68, 0.08)' : undefined
              }}>
                <div className="panel-header" style={{ background: activeAlerts.length > 0 ? '#fef2f2' : undefined }}>
                  <span className="panel-title" style={{ color: activeAlerts.length > 0 ? '#991b1b' : undefined }}>
                    ⚠️ Active Security Alerts
                  </span>
                  <span className="panel-badge" style={{ background: activeAlerts.length > 0 ? '#ef4444' : undefined, color: '#fff' }}>
                    {activeAlerts.length} Active
                  </span>
                </div>
                <div className="panel-body" style={{ padding: 16 }}>
                  {activeAlerts.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-title">No Active Alerts</div>
                      <div className="empty-state-desc">All visitor shift times and logistics schedules are operating normally.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {activeAlerts.map(a => (
                        <div key={a.id} style={{
                          padding: 12,
                          borderRadius: 8,
                          background: a.type === 'seal_mismatch' ? '#fffaf0' : '#fef2f2',
                          border: `1px solid ${a.type === 'seal_mismatch' ? '#fbd38d' : '#fca5a5'}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                              <span style={{
                                background: a.type === 'seal_mismatch' ? '#dd6b20' : '#e53e3e',
                                color: '#fff',
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                display: 'inline-block'
                              }}>
                                {a.type}
                              </span>
                              <p style={{ margin: '6px 0', fontSize: '0.82rem', color: '#1e293b', fontWeight: 600, lineHeight: 1.4 }}>
                                {a.message}
                              </p>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                                Logged: {a.timestamp || new Date(a.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => resolveAlert(a.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                background: '#fff',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: 6,
                                cursor: 'pointer',
                                color: '#475569',
                                fontWeight: 600,
                                flexShrink: 0
                              }}
                            >
                              Resolve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* VIEW: onboarding (Verified Company Directory) */}
          {view === 'onboarding' && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Verified Company Directory</span>
                <span className="panel-badge">{approvedVendors.length} Verified</span>
              </div>
              {approvedVendors.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-title">Directory Empty</div>
                    <div className="empty-state-desc">No external partners have been approved yet.</div>
                  </div>
                </div>
              ) : (
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Partner</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedVendors.map(c => (
                        <tr key={c.id}>
                          <td>
                            <div className="cell-primary" style={{ fontSize: '0.85rem' }}>{c.name}</div>
                            <div className="cell-secondary" style={{ fontSize: '0.75rem' }}>{c.email}</div>
                          </td>
                          <td><span className="zone-badge" style={{ textTransform: 'capitalize' }}>{c.type}</span></td>
                          <td><StatusPill status={c.status} /></td>
                          <td>
                            <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedCompany(c)}>View Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      {view === 'passes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', marginTop: 8 }}>
          
          {/* Final Gate Pass Clearance Requests (Step 2) */}
          {/* Final Gate Pass Clearance Requests (Step 2) */}
          {(() => {
            const getGroupedPendingPasses = (passesList) => {
              const groups = {};
              passesList.forEach(p => {
                const key = `${p.companyId}_${p.supervisorName}_${p.zoneLevel}_${p.startDate}_${p.endDate}_${p.startTime}_${p.endTime}_${p.purpose}`;
                if (!groups[key]) {
                  groups[key] = [];
                }
                groups[key].push(p);
              });
              return Object.values(groups).map(group => ({
                id: group[0].id,
                companyId: group[0].companyId,
                supervisorName: group[0].supervisorName,
                zoneLevel: group[0].zoneLevel,
                startDate: group[0].startDate,
                endDate: group[0].endDate,
                startTime: group[0].startTime,
                endTime: group[0].endTime,
                purpose: group[0].purpose,
                passes: group
              }));
            };
            const groupedPendingPasses = getGroupedPendingPasses(pendingPasses);

            return (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Final Gate Pass Clearance Requests (Step 2)</span>
                  <span className="panel-badge">{pendingPasses.length} Awaiting</span>
                </div>
                {pendingPasses.length === 0 ? (
                  <div className="panel-body">
                    <div className="empty-state">
                      <div className="empty-state-title">No Pending Clearance Requests</div>
                      <div className="empty-state-desc">All gate pass requests verified by Vendor Admins have been signed.</div>
                    </div>
                  </div>
                ) : (
                  <div className="panel-body-flush">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Pass ID</th>
                          <th>Worker(s)</th>
                          <th>Supervisor</th>
                          <th>Zone Clearance</th>
                          <th>Validity Window</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedPendingPasses.map(g => {
                          const isGroup = g.passes.length > 1;
                          const vendor = companies.find(c => c.id === g.companyId);
                          const workerNames = g.passes.map(p => {
                            const w = workers.find(wk => wk.id === p.workerId);
                            return w ? w.name : 'Unknown';
                          }).filter(Boolean);
                          const passIds = g.passes.map(p => p.id);

                          return (
                            <tr key={g.id}>
                              <td>
                                <div className="cell-mono cell-secondary">
                                  {isGroup ? `[${g.passes.length} Passes]` : `#${g.id.slice(-6)}`}
                                </div>
                              </td>
                              <td>
                                <div className="cell-primary" style={{ whiteSpace: 'normal', maxWidth: '300px' }}>
                                  {isGroup ? (
                                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                      👥 {workerNames.join(', ')}
                                    </span>
                                  ) : (
                                    workerNames[0] || 'Unknown'
                                  )}
                                  <div className="cell-secondary">{vendor?.name}</div>
                                </div>
                              </td>
                              <td>
                                <div className="cell-secondary" style={{ fontWeight: 500, color: '#475569' }}>
                                  👤 {g.supervisorName || 'N/A'}
                                </div>
                              </td>
                              <td><span className="zone-badge">{g.zoneLevel}</span></td>
                              <td>
                                <div className="cell-secondary">{g.startDate} to {g.endDate}</div>
                                <div className="cell-secondary">{g.startTime} – {g.endTime}</div>
                              </td>
                              <td>
                                <div className="actions-cell">
                                  {isGroup ? (
                                    <>
                                      <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedPass(g.passes[0])}>View Details</button>
                                      <button className="btn-action btn-approve" onClick={() => approvePassCevaBulk(passIds, true)}>Approve & Sign All</button>
                                      <button className="btn-action btn-reject" onClick={() => approvePassCevaBulk(passIds, false)}>Deny All</button>
                                    </>
                                  ) : (
                                    <>
                                      <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedPass(g.passes[0])}>View Details</button>
                                      <button className="btn-action btn-approve" onClick={() => approvePassCeva(g.id, true)}>Approve & Sign</button>
                                      <button className="btn-action btn-reject" onClick={() => approvePassCeva(g.id, false)}>Deny</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Issued Pass Registry (HMAC Authorized) */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Issued Pass Registry (HMAC Authorized)</span>
              <span className="panel-badge">{approvedPasses.length} Active</span>
            </div>
            {approvedPasses.length === 0 ? (
              <div className="panel-body">
                <div className="empty-state">
                  <div className="empty-state-title">No Issued Passes</div>
                  <div className="empty-state-desc">No digital gate passes have been authorized yet.</div>
                </div>
              </div>
            ) : (
              <div className="panel-body-flush" style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visitor Details</th>
                      <th>HMAC Secure Signature</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedPasses.map(p => {
                      const worker = workers.find(w => w.id === p.workerId);
                      const vendor = companies.find(c => c.id === p.companyId);
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="cell-primary" style={{ fontSize: '0.85rem' }}>{worker?.name}</div>
                            <div className="cell-secondary" style={{ fontSize: '0.75rem' }}>{vendor?.name} · {p.endDate}</div>
                          </td>
                          <td>
                            <div className="sig-label">SHA-256</div>
                            <div className="sig-box" style={{ wordBreak: 'break-all', fontSize: '0.68rem', fontFamily: 'monospace' }}>
                              {p.qr_secure_signature || 'Signed server-side'}
                            </div>
                          </td>
                          <td>
                            <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedPass(p)}>View Details</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
      {selectedPass && (
        <PassDetailsModal
          pass={selectedPass}
          onClose={() => setSelectedPass(null)}
          workers={workers}
          supervisors={supervisors}
          companies={companies}
          passes={passes}
        />
      )}
      {selectedCompany && (
        <CompanyDetailsModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          companies={companies}
        />
      )}
    </>
  );
}
