import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';
import { useAuth } from '../context/AuthContext';

function StatusPill({ status }) {
  const map = {
    approved: 'pill-approved', pending: 'pill-pending',
    pending_vendor: 'pill-pending_vendor', pending_ceva: 'pill-pending_ceva', rejected: 'pill-rejected',
  };
  const label = { approved: 'Approved', pending: 'Pending', pending_vendor: 'Vendor Review', pending_ceva: 'Ceva Review', rejected: 'Rejected' };
  return <span className={`status-pill ${map[status] || 'pill-pending'}`}>{label[status] || status}</span>;
}

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

function WorkerDetailsModal({ worker, onClose, onDelete, companies }) {
  if (!worker) return null;
  const company = companies.find(c => c.id === worker.companyId);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-box slide-in" style={{ maxWidth: 450 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
          <div className="modal-title" style={{ margin: 0 }}>Worker Details</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {worker.photo ? (
              <img src={worker.photo} alt={worker.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.2rem' }}>{worker.name?.[0]}</div>
            )}
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{worker.name}</div>
              <div style={{ marginTop: 4 }}><StatusPill status={worker.status} /></div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            <div>
              <strong style={{ color: '#64748b' }}>Email:</strong> {worker.email}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>Phone:</strong> {worker.phone}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>Company:</strong> {company?.name || 'Loading company...'}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>Supervisor:</strong> {worker.supervisorName || 'None assigned'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" onClick={onDelete} style={{ background: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', flex: 1, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Delete Worker</button>
          <button type="button" onClick={onClose} className="btn-primary" style={{ padding: '10px 20px', width: 'auto', flex: 1, margin: 0, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function SupervisorDetailsModal({ supervisor, onClose, onDelete, companies }) {
  if (!supervisor) return null;
  const company = companies.find(c => c.id === supervisor.companyId);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-box slide-in" style={{ maxWidth: 450 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
          <div className="modal-title" style={{ margin: 0 }}>Supervisor Details</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{supervisor.name}</div>
          <div style={{ margin: '2px 0' }}><StatusPill status={supervisor.status} /></div>

          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            <div>
              <strong style={{ color: '#64748b' }}>Email Address:</strong> {supervisor.email}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>Phone Number:</strong> {supervisor.phone || 'N/A'}
            </div>
            <div>
              <strong style={{ color: '#64748b' }}>Company Scope:</strong> {company?.name || 'Loading company...'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" onClick={onDelete} style={{ background: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', flex: 1, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Delete Supervisor</button>
          <button type="button" onClick={onClose} className="btn-primary" style={{ padding: '10px 20px', width: 'auto', flex: 1, margin: 0, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Close</button>
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

export default function CompanyAdminDashboard({ view }) {
  const {
    companies, verifyCompany, workers, verifyWorker, deleteWorker,
    passes, approvePassVendor, approvePassVendorBulk, registerWorker, requestPass,
    supervisors = [], registerSupervisor, verifySupervisor, deleteSupervisor, logs = [],
    trucks = [], drivers = [], deliveries = [], alerts = [],
  } = useSystem();
  const { profile } = useAuth();

  const approvedCompanies = companies.filter(c => c.status === 'approved' && c.type === 'vendor');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  React.useEffect(() => {
    if (profile?.company_id) {
      setSelectedCompanyId(profile.company_id);
    } else if (approvedCompanies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(approvedCompanies[0].id);
    }
  }, [profile, approvedCompanies, selectedCompanyId]);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const subPending = companies.filter(c => c.type === 'trucking' && c.parentCompanyId === selectedCompanyId && c.status === 'pending_vendor');

  /* Worker form */
  const [wName, setWName] = useState('');
  const [wEmail, setWEmail] = useState('');
  const [wPhone, setWPhone] = useState('');
  const [wSupervisor, setWSupervisor] = useState('');
  const [wPhoto, setWPhoto] = useState('');
  const [wMsg, setWMsg] = useState('');

  /* Supervisor form */
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sPhoto, setSPhoto] = useState('');
  const [sMsg, setSMsg] = useState('');

  /* Gate Pass form */
  const [passWorkerIds, setPassWorkerIds] = useState([]);
  const [passZone, setPassZone] = useState('Zone A - Warehouse Floor');
  const [passStartDate, setPassStartDate] = useState('');
  const [passEndDate, setPassEndDate] = useState('');
  const [passStartTime, setPassStartTime] = useState('08:00');
  const [passEndTime, setPassEndTime] = useState('17:00');
  const [passPurpose, setPassPurpose] = useState('');
  const [passSupervisor, setPassSupervisor] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [selectedPass, setSelectedPass] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [workerSupervisors, setWorkerSupervisors] = useState({});

  const currentCompany = companies.find(c => c.id === selectedCompanyId);
  const companyWorkers = workers.filter(w => w.companyId === selectedCompanyId);
  const pendingWorkers = companyWorkers.filter(w => w.status === 'pending');
  const verifiedWorkers = companyWorkers.filter(w => w.status === 'approved');
  const pendingPasses = passes.filter(p => p.companyId === selectedCompanyId && p.status === 'pending_vendor');
  const companyPendingPasses = passes.filter(p => p.companyId === selectedCompanyId && (p.status === 'pending_vendor' || p.status === 'pending_ceva'));
  const allCompanyPasses = passes.filter(p => p.companyId === selectedCompanyId);
  const companySupervisors = supervisors.filter(s => s.companyId === selectedCompanyId);
  const approvedSupervisors = companySupervisors.filter(s => s.status === 'approved');
  const companyAlerts = alerts.filter(a => {
    if (a.resolved) return false;
    const pass = passes.find(p => p.id === a.passId);
    if (pass && pass.companyId === selectedCompanyId) return true;
    const delivery = deliveries.find(d => d.id === a.passId);
    if (delivery && delivery.companyId === selectedCompanyId) return true;
    return false;
  });

  const handleAddWorker = (e) => {
    e.preventDefault();
    if (!selectedCompanyId) { setWMsg('Select a company first.'); return; }
    if (!wName || !wSupervisor) { setWMsg('Name and Supervisor are required.'); return; }
    registerWorker(
      wName, selectedCompanyId, wSupervisor,
      wEmail || `${wName.toLowerCase().replace(/\s+/g, '_')}@vendor.com`,
      wPhone || '+1 555-0000',
      wPhoto
    );
    setWName(''); setWEmail(''); setWPhone(''); setWSupervisor(''); setWPhoto('');
    setWMsg('Worker registered and pending verification.');
    setTimeout(() => setWMsg(''), 4000);
  };

  const handleAddSupervisor = (e) => {
    e.preventDefault();
    if (!selectedCompanyId) { setSMsg('Select a company first.'); return; }
    if (!sName || !sEmail) { setSMsg('Name and Email are required.'); return; }
    registerSupervisor(sName, sEmail, sPhone, selectedCompanyId, sPhoto);
    setSName(''); setSEmail(''); setSPhone(''); setSPhoto('');
    setSMsg('Supervisor registered successfully.');
    setTimeout(() => setSMsg(''), 4000);
  };

  const handleRequestPass = (e) => {
    e.preventDefault();
    if (passWorkerIds.length === 0 || !passStartDate || !passEndDate || !passPurpose || !passSupervisor) {
      setPassMsg('All fields are required and at least one worker must be selected.'); return;
    }
    passWorkerIds.forEach(workerId => {
      requestPass(workerId, passZone, passStartDate, passEndDate, passStartTime, passEndTime, passPurpose, passSupervisor);
    });
    setPassWorkerIds([]); setPassPurpose(''); setPassSupervisor('');
    setPassMsg(`Gate pass request submitted for Ceva review for ${passWorkerIds.length} worker(s).`);
    setTimeout(() => setPassMsg(''), 4000);
  };

  if (approvedCompanies.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div className="page-title-block">
            <div className="page-title">Company Admin Portal</div>
            <div className="page-subtitle">Manage workers, passes, and access requests</div>
          </div>
          <span className="page-header-badge badge-vendor">Vendor Admin</span>
        </div>
        <div className="panel"><div className="panel-body">
          <div className="empty-state">
            <div className="empty-state-title">No Approved Companies</div>
            <div className="empty-state-desc">No vendor companies are approved yet. Ceva Admin must approve a registration first.</div>
          </div>
        </div></div>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="page-title-block">
          <div className="page-title">Company Admin Portal</div>
          <div className="page-subtitle">Manage workers, submit gate passes, and review access requests</div>
        </div>
        <span className="page-header-badge badge-vendor">Vendor Admin</span>
      </div>

      {/* Critical Security Alerts */}
      {companyAlerts.length > 0 && (
        <div className="alert-banner" style={{ marginBottom: 20 }}>
          <div className="alert-banner-label pulse-text">Critical Security Alerts ({companyAlerts.length})</div>
          {companyAlerts.map(a => (
            <div key={a.id} className="alert-item">
              <div>
                <div className="alert-item-text">{a.message}</div>
                <div className="alert-item-time">Logged: {a.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Company Selector */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="control-bar">
          {profile?.role === 'company_admin' ? (
            <span className="cell-primary" style={{ fontSize: '0.95rem', color: 'var(--ceva-blue)' }}>
              {currentCompany?.name || 'Loading company details...'}
            </span>
          ) : (
            <select
              className="control-bar-select"
              value={selectedCompanyId}
              onChange={e => setSelectedCompanyId(e.target.value)}
            >
              {approvedCompanies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          {currentCompany && (
            <StatusPill status={currentCompany.status} />
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {companyWorkers.length} total workers &nbsp;·&nbsp; {allCompanyPasses.length} passes
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row cols-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
          </div>
          <div className="stat-body">
            <div className="stat-value">{companyWorkers.length}</div>
            <div className="stat-label">Total Workers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div className="stat-body">
            <div className="stat-value">{approvedSupervisors.length}</div>
            <div className="stat-label">Approved Supervisors</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" /></svg>
          </div>
          <div className="stat-body">
            <div className="stat-value">{allCompanyPasses.filter(p => p.checkedIn && !p.checkedOut).length}</div>
            <div className="stat-label">Active On-Site</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
          </div>
          <div className="stat-body">
            <div className="stat-value">{companyPendingPasses.length}</div>
            <div className="stat-label">Pending Passes</div>
          </div>
        </div>
      </div>

      {view !== '3pl' ? (
        <div className="content-grid">
          {/* Left Column / Primary Content */}
          <div style={{ gridColumn: view === 'verify' ? 'span 2' : 'span 1' }}>
            {/* Dashboard View: Active On-Site Roster */}
            {view === 'dashboard' && (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Active On-Site Roster</span>
                  <span className="panel-badge">
                    {allCompanyPasses.filter(p => p.checkedIn && !p.checkedOut).length} Present
                  </span>
                </div>
                {allCompanyPasses.filter(p => p.checkedIn && !p.checkedOut).length === 0 ? (
                  <div className="panel-body">
                    <div className="empty-state">
                      <div className="empty-state-title">No Workers Currently On-Site</div>
                      <div className="empty-state-desc">Workers registered under your company will appear here once they check in at the gate.</div>
                    </div>
                  </div>
                ) : (
                  <div className="panel-body-flush">
                    <table className="data-table">
                      <thead>
                        <tr><th>Worker</th><th>Supervisor</th><th>Clearance Zone</th><th>Dates</th></tr>
                      </thead>
                      <tbody>
                        {allCompanyPasses.filter(p => p.checkedIn && !p.checkedOut).map(p => {
                          const worker = workers.find(w => w.id === p.workerId);
                          return (
                            <tr key={p.id}>
                              <td>
                                <div className="cell-primary">{worker?.name || 'Unknown'}</div>
                                <div className="cell-secondary">{worker?.email || ''}</div>
                              </td>
                              <td><div className="cell-secondary">{p.supervisorName}</div></td>
                              <td><span className="zone-badge">{p.zoneLevel}</span></td>
                              <td><div className="cell-secondary">{p.startDate} – {p.endDate}</div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Supervisors View: Roster */}
            {view === 'supervisors' && (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Approved Supervisors Roster</span>
                  <span className="panel-badge">{companySupervisors.length} Registered</span>
                </div>
                {companySupervisors.length === 0 ? (
                  <div className="panel-body">
                    <div className="empty-state">
                      <div className="empty-state-title">No Registered Supervisors</div>
                      <div className="empty-state-desc">Use the form on the right to register supervisors for your organization.</div>
                    </div>
                  </div>
                ) : (
                  <div className="panel-body-flush">
                    <table className="data-table">
                      <thead>
                        <tr><th>Supervisor</th><th>Contact Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {companySupervisors.map(s => (
                          <tr key={s.id}>
                            <td><div className="cell-primary">{s.name}</div></td>
                            <td><div className="cell-secondary">{s.email}</div></td>
                            <td><div className="cell-secondary">{s.phone || 'N/A'}</div></td>
                            <td><StatusPill status={s.status} /></td>
                            <td>
                              <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedSupervisor(s)}>View Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Worker Profile Verification */}
            {(!view || view === 'verify') && (
              <div className="panel" style={{ marginBottom: 20 }}>
                <div className="panel-header">
                  <span className="panel-title">Worker Profile Verification</span>
                  <span className="panel-badge">{pendingWorkers.length} Pending</span>
                </div>
                {pendingWorkers.length === 0 ? (
                  <div className="panel-body">
                    <div className="empty-state">
                      <div className="empty-state-title">All Profiles Verified</div>
                      <div className="empty-state-desc">No workers are awaiting profile verification.</div>
                    </div>
                  </div>
                ) : (
                  <div className="panel-body-flush">
                    <table className="data-table">
                      <thead>
                        <tr><th>Worker</th><th>Supervisor</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {pendingWorkers.map(w => (
                          <tr key={w.id}>
                            <td>
                              <div className="cell-with-avatar">
                                {w.photo
                                  ? <img src={w.photo} alt={w.name} className="cell-avatar" />
                                  : <div className="cell-avatar-initials">{w.name?.[0]}</div>
                                }
                                <div>
                                  <div className="cell-primary">{w.name}</div>
                                  <div className="cell-secondary">{w.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <select
                                value={workerSupervisors[w.id] || (w.supervisorName !== 'Pending Assignment' ? w.supervisorName : '')}
                                onChange={(e) => setWorkerSupervisors(prev => ({ ...prev, [w.id]: e.target.value }))}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1.5px solid #cbd5e1',
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                  background: '#fff',
                                  color: '#0f172a',
                                  width: '100%',
                                  maxWidth: '220px'
                                }}
                              >
                                <option value="">-- Assign Supervisor --</option>
                                {approvedSupervisors.map(s => (
                                  <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div className="actions-cell">
                                <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedWorker(w)}>View Details</button>
                                <button
                                  className="btn-action btn-approve"
                                  onClick={() => {
                                    const assignedSup = workerSupervisors[w.id] || (w.supervisorName !== 'Pending Assignment' ? w.supervisorName : '');
                                    if (!assignedSup) {
                                      alert(`Please assign a supervisor for ${w.name} before verifying.`);
                                      return;
                                    }
                                    verifyWorker(w.id, true, assignedSup);
                                  }}
                                >
                                  Verify
                                </button>
                                <button className="btn-action btn-reject" onClick={() => verifyWorker(w.id, false)}>Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Initial Pass Verification - Step 1 */}
            {(!view || view === 'verify') && (() => {
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
                <div className="panel" style={{ marginBottom: 20 }}>
                  <div className="panel-header">
                    <span className="panel-title">Pass Verification — Step 1 (Vendor Review)</span>
                    <span className="panel-badge">{pendingPasses.length} Pending</span>
                  </div>
                  {pendingPasses.length === 0 ? (
                    <div className="panel-body">
                      <div className="empty-state">
                        <div className="empty-state-title">No Pending Pass Requests</div>
                        <div className="empty-state-desc">No gate pass requests awaiting initial review.</div>
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
                            <th>Zone</th>
                            <th>Dates</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedPendingPasses.map(g => {
                            const isGroup = g.passes.length > 1;
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
                                  </div>
                                </td>
                                <td>
                                  <div className="cell-secondary" style={{ fontWeight: 500, color: '#475569' }}>
                                    👤 {g.supervisorName || 'N/A'}
                                  </div>
                                </td>
                                <td><span className="zone-badge">{g.zoneLevel}</span></td>
                                <td><div className="cell-secondary">{g.startDate} – {g.endDate}</div></td>
                                <td>
                                  <div className="actions-cell">
                                    {isGroup ? (
                                      <>
                                        <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedPass(g.passes[0])}>View Details</button>
                                        <button className="btn-action btn-approve" onClick={() => approvePassVendorBulk(passIds, true)}>Verify & Forward All</button>
                                        <button className="btn-action btn-reject" onClick={() => approvePassVendorBulk(passIds, false)}>Reject All</button>
                                      </>
                                    ) : (
                                      <>
                                        <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedPass(g.passes[0])}>View Details</button>
                                        <button className="btn-action btn-approve" onClick={() => approvePassVendor(g.id, true)}>Verify & Forward</button>
                                        <button className="btn-action btn-reject" onClick={() => approvePassVendor(g.id, false)}>Reject</button>
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

            {/* Sub-Contractor Routing Approvals for Parent Vendors */}
            {(!view || view === 'verify') && subPending.length > 0 && (
              <div className="panel" style={{ marginBottom: 20 }}>
                <div className="panel-header">
                  <span className="panel-title">Sub-Contractor Routing Approvals (3PL Partners)</span>
                  <span className="panel-badge">{subPending.length} Pending</span>
                </div>
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead>
                      <tr><th>Company</th><th>Contact</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {subPending.map(c => (
                        <tr key={c.id}>
                          <td><div className="cell-primary">{c.name}</div></td>
                          <td><div className="cell-secondary">{c.email}</div></td>
                          <td>
                            <div className="actions-cell">
                              <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedCompany(c)}>View Details</button>
                              <button className="btn-action btn-approve" onClick={() => verifyCompany(c.id, true)}>Approve & Route</button>
                              <button className="btn-action btn-reject" onClick={() => verifyCompany(c.id, false)}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Verified Worker Roster */}
            {(!view || view === 'workers') && (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Verified Worker Roster</span>
                  <span className="panel-badge">{verifiedWorkers.length} Workers</span>
                </div>
                {verifiedWorkers.length === 0 ? (
                  <div className="panel-body">
                    <div className="empty-state">
                      <div className="empty-state-title">No Verified Workers</div>
                      <div className="empty-state-desc">Verify worker profiles above to populate the roster.</div>
                    </div>
                  </div>
                ) : (
                  <div className="panel-body-flush">
                    <table className="data-table">
                      <thead>
                        <tr><th>Worker</th><th>Contact</th><th>Supervisor</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {verifiedWorkers.map(w => (
                          <tr key={w.id}>
                            <td>
                              <div className="cell-with-avatar">
                                {w.photo
                                  ? <img src={w.photo} alt={w.name} className="cell-avatar" />
                                  : <div className="cell-avatar-initials">{w.name?.[0]}</div>
                                }
                                <div>
                                  <div className="cell-primary">{w.name}</div>
                                  <div className="cell-secondary">{w.email}</div>
                                </div>
                              </div>
                            </td>
                            <td><div className="cell-secondary">{w.phone}</div></td>
                            <td><div className="cell-secondary">{w.supervisorName}</div></td>
                            <td><StatusPill status={w.status} /></td>
                            <td>
                              <button type="button" className="btn-action" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setSelectedWorker(w)}>View Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Company Passes Registry / History */}
            {view === 'passes' && (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Gate Pass Registry / History</span>
                  <span className="panel-badge">{allCompanyPasses.length} Passes</span>
                </div>
                {allCompanyPasses.length === 0 ? (
                  <div className="panel-body">
                    <div className="empty-state">
                      <div className="empty-state-title">No Passes Requested</div>
                      <div className="empty-state-desc">Use the form on the right to submit pass requests.</div>
                    </div>
                  </div>
                ) : (
                  <div className="panel-body-flush">
                    <table className="data-table">
                      <thead>
                        <tr><th>Pass ID</th><th>Worker</th><th>Zone</th><th>Dates</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {allCompanyPasses.map(p => {
                          const worker = workers.find(w => w.id === p.workerId);
                          return (
                            <tr key={p.id}>
                              <td><div className="cell-mono cell-secondary">#{p.id.slice(-6)}</div></td>
                              <td><div className="cell-primary">{worker?.name || 'Unknown'}</div></td>
                              <td><span className="zone-badge">{p.zoneLevel}</span></td>
                              <td><div className="cell-secondary">{p.startDate} – {p.endDate}</div></td>
                              <td><StatusPill status={p.status} /></td>
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
            )}
          </div>

          {/* Right Column / Forms */}
          {view !== 'verify' && (
            <div>
              {/* Dashboard View: Live Scoped Entrance Logs */}
              {view === 'dashboard' && (
                <>
                  <div className="log-console-panel" style={{ marginBottom: 20 }}>
                    <div className="log-console-header">
                      <div className="log-live-dot" />
                      <span className="log-console-label">Facility Entrance Logs</span>
                    </div>
                    <div className="log-console-body" style={{ height: 380 }}>
                      {logs.filter(l => l.companyName === currentCompany?.name).length === 0 ? (
                        <div className="log-empty">No entrance events recorded for your workers.</div>
                      ) : (
                        logs.filter(l => l.companyName === currentCompany?.name).map(log => (
                          <div key={log.id} className="log-line">
                            <span className="log-ts">[{log.timestamp}]</span>
                            <span className={log.action === 'check_in' ? 'log-entry-text' : 'log-exit-text'}>
                              {log.action === 'check_in' ? 'CHECK-IN' : 'CHECK-OUT'}
                            </span>
                            <span className="log-name">{log.workerName}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Active Security Alerts Panel */}
                  <div className="panel" style={{ 
                    borderLeft: companyAlerts.length > 0 ? '4px solid #ef4444' : undefined,
                    boxShadow: companyAlerts.length > 0 ? '0 4px 12px rgba(239, 68, 68, 0.08)' : undefined
                  }}>
                    <div className="panel-header" style={{ background: companyAlerts.length > 0 ? '#fef2f2' : undefined }}>
                      <span className="panel-title" style={{ color: companyAlerts.length > 0 ? '#991b1b' : undefined }}>
                        ⚠️ Active Security Alerts
                      </span>
                      <span className="panel-badge" style={{ background: companyAlerts.length > 0 ? '#ef4444' : undefined, color: '#fff' }}>
                        {companyAlerts.length} Active
                      </span>
                    </div>
                    <div className="panel-body" style={{ padding: 16 }}>
                      {companyAlerts.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-state-title">No Active Alerts</div>
                          <div className="empty-state-desc">Your team and logistics schedules are operating normally.</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {companyAlerts.map(a => (
                            <div key={a.id} style={{
                              padding: 12,
                              borderRadius: 8,
                              background: a.type === 'seal_mismatch' ? '#fffaf0' : '#fef2f2',
                              border: `1px solid ${a.type === 'seal_mismatch' ? '#fbd38d' : '#fca5a5'}`
                            }}>
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
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Supervisors View: Register New Supervisor */}
              {view === 'supervisors' && (
                <div className="form-panel">
                  <div className="form-panel-header">
                    <div className="form-panel-title">Add Approved Supervisor</div>
                    <div className="form-panel-desc">Register a new company supervisor. They will be immediately available.</div>
                  </div>
                  <div className="form-panel-body">
                    <form onSubmit={handleAddSupervisor} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="field-group">
                        <label>Full Name *</label>
                        <input type="text" placeholder="e.g. Robert Downey" value={sName} onChange={e => setSName(e.target.value)} required />
                      </div>
                      <div className="field-group">
                        <label>Email Address *</label>
                        <input type="email" placeholder="robert@company.com" value={sEmail} onChange={e => setSEmail(e.target.value)} required />
                      </div>
                      <div className="field-group">
                        <label>Phone Number</label>
                        <input type="text" placeholder="+1 555-0100" value={sPhone} onChange={e => setSPhone(e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label>Profile Photo</label>
                        <div className="photo-upload-zone">
                          {sPhoto ? (
                            <div className="photo-upload-preview-wrap">
                              <img src={sPhoto} className="photo-upload-preview" alt="Preview" />
                              <button type="button" className="photo-upload-remove-btn" onClick={() => setSPhoto('')}>&times;</button>
                            </div>
                          ) : (
                            <>
                              <div className="photo-upload-text">
                                <strong>Click to upload</strong> or drag and drop
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>PNG, JPG or GIF</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="photo-upload-input"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setSPhoto(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary">Add Supervisor</button>
                      {sMsg && <div className="form-feedback-success">{sMsg}</div>}
                    </form>
                  </div>
                </div>
              )}

              {/* Register New Worker */}
              {(!view || view === 'workers') && (
                <div className="form-panel" style={{ marginBottom: 20 }}>
                  <div className="form-panel-header">
                    <div className="form-panel-title">Register New Worker</div>
                    <div className="form-panel-desc">New workers require profile verification before gate pass requests.</div>
                  </div>
                  <div className="form-panel-body">
                    <form onSubmit={handleAddWorker} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="fields-row">
                        <div className="field-group">
                          <label>Full Name *</label>
                          <input type="text" placeholder="John Smith" value={wName} onChange={e => setWName(e.target.value)} required />
                        </div>
                        <div className="field-group">
                          <label>Approved Supervisor *</label>
                          <select value={wSupervisor} onChange={e => setWSupervisor(e.target.value)} required>
                            <option value="">Choose Supervisor</option>
                            {approvedSupervisors.map(s => (
                              <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="fields-row">
                        <div className="field-group">
                          <label>Email Address</label>
                          <input type="email" placeholder="john@vendor.com" value={wEmail} onChange={e => setWEmail(e.target.value)} />
                        </div>
                        <div className="field-group">
                          <label>Phone Number</label>
                          <input type="text" placeholder="+1 555-1234" value={wPhone} onChange={e => setWPhone(e.target.value)} />
                        </div>
                      </div>
                      <div className="field-group">
                        <label>Profile Photo</label>
                        <div className="photo-upload-zone">
                          {wPhoto ? (
                            <div className="photo-upload-preview-wrap">
                              <img src={wPhoto} className="photo-upload-preview" alt="Preview" />
                              <button type="button" className="photo-upload-remove-btn" onClick={() => setWPhoto('')}>&times;</button>
                            </div>
                          ) : (
                            <>
                              <div className="photo-upload-text">
                                <strong>Click to upload</strong> or drag and drop
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>PNG, JPG or GIF</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="photo-upload-input"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setWPhoto(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary">Register Worker</button>
                      {wMsg && <div className="form-feedback-success">{wMsg}</div>}
                    </form>
                  </div>
                </div>
              )}

              {/* Request Gate Pass */}
              {view === 'passes' && (
                <div className="form-panel" style={{ marginBottom: 20 }}>
                  <div className="form-panel-header">
                    <div className="form-panel-title">Request Gate Pass</div>
                    <div className="form-panel-desc">Only verified workers can be selected for a gate pass request.</div>
                  </div>
                  <div className="form-panel-body">
                    <form onSubmit={handleRequestPass} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="field-group">
                        <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>Select Workers * (Select multiple)</label>
                        <div style={{
                          border: '1.5px solid #cbd5e1', borderRadius: '8px',
                          padding: '12px', background: '#f8fafc',
                          maxHeight: '140px', overflowY: 'auto',
                          display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px'
                        }}>
                          {verifiedWorkers.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No verified workers registered yet.</div>
                          ) : (
                            verifiedWorkers.map(w => {
                              const isChecked = passWorkerIds.includes(w.id);
                              return (
                                <label key={w.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: '#0f172a' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setPassWorkerIds(prev => prev.filter(id => id !== w.id));
                                      } else {
                                        setPassWorkerIds(prev => [...prev, w.id]);
                                      }
                                    }}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                  />
                                  <span>{w.name}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="fields-row">
                        <div className="field-group">
                          <label>Designated Supervisor *</label>
                          <select value={passSupervisor} onChange={e => setPassSupervisor(e.target.value)} required>
                            <option value="">Select Supervisor</option>
                            {approvedSupervisors.map(s => (
                              <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="field-group">
                          <label>Access Zone *</label>
                          <select value={passZone} onChange={e => setPassZone(e.target.value)}>
                            <option value="Zone A - Warehouse Floor">Zone A - Warehouse Floor</option>
                            <option value="Zone B - Cargo Loading">Zone B - Cargo Loading</option>
                            <option value="Zone C - Administration">Zone C - Administration</option>
                          </select>
                        </div>
                      </div>
                      <div className="fields-row">
                        <div className="field-group">
                          <label>Start Date *</label>
                          <input type="date" value={passStartDate} onChange={e => setPassStartDate(e.target.value)} required />
                        </div>
                        <div className="field-group">
                          <label>End Date *</label>
                          <input type="date" value={passEndDate} onChange={e => setPassEndDate(e.target.value)} required />
                        </div>
                      </div>
                      <div className="fields-row">
                        <div className="field-group">
                          <label>Shift Start</label>
                          <input type="time" value={passStartTime} onChange={e => setPassStartTime(e.target.value)} />
                        </div>
                        <div className="field-group">
                          <label>Shift End</label>
                          <input type="time" value={passEndTime} onChange={e => setPassEndTime(e.target.value)} />
                        </div>
                      </div>
                      <div className="field-group">
                        <label>Purpose of Visit *</label>
                        <input type="text" placeholder="e.g. Server rack repair" value={passPurpose} onChange={e => setPassPurpose(e.target.value)} required />
                      </div>
                      <button type="submit" className="btn-primary">Submit Pass Request</button>
                      {passMsg && <div className="form-feedback-success">{passMsg}</div>}
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 3PL Fleet Management View (Full Width) */
        <div style={{ marginTop: 20 }}>
          {(() => {
            const sub3PLs = companies.filter(c => c.type === 'trucking' && c.parentCompanyId === selectedCompanyId);
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>3PL Fleet Management</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>Sub-contracted carrier partners under {currentCompany?.name || 'your company'}</div>
                  </div>
                  <span style={{ background: '#7c3aed', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                    {sub3PLs.length} Partner{sub3PLs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {sub3PLs.length === 0 ? (
                  <div className="panel">
                    <div className="panel-body">
                      <div className="empty-state">
                        <div className="empty-state-title">No Sub-Contracted Partners Yet</div>
                        <div className="empty-state-desc">When 3PL carriers register with your company as their parent, they will appear here once their registration is approved.</div>
                      </div>
                    </div>
                  </div>
                ) : sub3PLs.map(carrier => {
                  const carrierTrucks = trucks.filter(t => t.companyId === carrier.id);
                  const carrierDrivers = drivers.filter(d => d.companyId === carrier.id);
                  const carrierDeliveries = deliveries.filter(d => d.companyId === carrier.id);
                  const approvedTrucks = carrierTrucks.filter(t => t.status === 'approved').length;
                  const approvedDrivers = carrierDrivers.filter(d => d.status === 'approved').length;
                  const activeDispatches = carrierDeliveries.filter(d => d.status === 'checked_in').length;

                  return (
                    <div key={carrier.id} style={{ marginBottom: 28 }}>
                      {/* Carrier header card */}
                      <div className="panel" style={{ marginBottom: 16 }}>
                        <div className="panel-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
                              {carrier.name?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{carrier.name}</div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{carrier.email} &nbsp;&middot;&nbsp; {carrier.phone}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#0f172a' }}>{carrierTrucks.length}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Trucks ({approvedTrucks} approved)</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#0f172a' }}>{carrierDrivers.length}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Drivers ({approvedDrivers} approved)</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#16a34a' }}>{activeDispatches}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Active On-Site</div>
                            </div>
                          </div>
                          <span className={`status-pill ${carrier.status === 'approved' ? 'pill-approved' : carrier.status === 'pending_ceva' ? 'pill-pending_ceva' : 'pill-pending'}`}>
                            {carrier.status === 'approved' ? 'Approved' : carrier.status === 'pending_ceva' ? 'CEVA Review' : carrier.status}
                          </span>
                        </div>
                      </div>

                      {/* Trucks & Drivers side by side */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                        {/* Trucks */}
                        <div className="panel">
                          <div className="panel-header">
                            <span className="panel-title">Truck Roster</span>
                            <span className="panel-badge">{carrierTrucks.length}</span>
                          </div>
                          {carrierTrucks.length === 0 ? (
                            <div className="panel-body"><div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center' }}>No trucks registered yet</div></div>
                          ) : (
                            <div className="panel-body-flush">
                              <table className="data-table">
                                <thead><tr><th>Plate</th><th>Model</th><th>Status</th></tr></thead>
                                <tbody>
                                  {carrierTrucks.map(t => (
                                    <tr key={t.id}>
                                      <td><div className="cell-primary" style={{ fontFamily: 'monospace' }}>{t.plate}</div></td>
                                      <td><div className="cell-secondary">{t.model}</div></td>
                                      <td><span className={`status-pill ${t.status === 'approved' ? 'pill-approved' : t.status === 'rejected' ? 'pill-rejected' : 'pill-pending'}`}>{t.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Drivers */}
                        <div className="panel">
                          <div className="panel-header">
                            <span className="panel-title">Driver Roster</span>
                            <span className="panel-badge">{carrierDrivers.length}</span>
                          </div>
                          {carrierDrivers.length === 0 ? (
                            <div className="panel-body"><div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center' }}>No drivers registered yet</div></div>
                          ) : (
                            <div className="panel-body-flush">
                              <table className="data-table">
                                <thead><tr><th>Driver Name</th><th>CDL License</th><th>Status</th></tr></thead>
                                <tbody>
                                  {carrierDrivers.map(d => (
                                    <tr key={d.id}>
                                      <td><div className="cell-primary">{d.name}</div></td>
                                      <td><div className="cell-secondary" style={{ fontFamily: 'monospace' }}>{d.license}</div></td>
                                      <td><span className={`status-pill ${d.status === 'approved' ? 'pill-approved' : d.status === 'rejected' ? 'pill-rejected' : 'pill-pending'}`}>{d.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Active Dispatches */}
                      <div className="panel">
                        <div className="panel-header">
                          <span className="panel-title">Dispatch & Delivery Activity</span>
                          <span className="panel-badge">{carrierDeliveries.length} total &nbsp;&middot;&nbsp; {activeDispatches} active</span>
                        </div>
                        {carrierDeliveries.length === 0 ? (
                          <div className="panel-body"><div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center' }}>No dispatches recorded</div></div>
                        ) : (
                          <div className="panel-body-flush">
                            <table className="data-table">
                              <thead><tr><th>ID</th><th>Type</th><th>Seal #</th><th>Cargo Details</th><th>Status</th></tr></thead>
                              <tbody>
                                {carrierDeliveries.map(d => (
                                  <tr key={d.id}>
                                    <td><div className="cell-mono cell-secondary">#{d.id.slice(-6)}</div></td>
                                    <td><span style={{ textTransform: 'capitalize', fontWeight: 600, color: d.type === 'dropoff' ? '#0891b2' : '#7c3aed', fontSize: '0.8rem' }}>{d.type}</span></td>
                                    <td><div className="cell-secondary" style={{ fontFamily: 'monospace' }}>{d.sealNumber}</div></td>
                                    <td><div className="cell-secondary">{d.items || '—'}</div></td>
                                    <td>
                                      <span className={`status-pill ${d.status === 'checked_in' ? 'pill-approved' : d.status === 'checked_out' ? 'pill-pending_ceva' : 'pill-pending'}`}>
                                        {d.status === 'checked_in' ? 'On-Site' : d.status === 'checked_out' ? 'Departed' : 'Assigned'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
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
      {selectedWorker && (
        <WorkerDetailsModal
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onDelete={() => { deleteWorker(selectedWorker.id); setSelectedWorker(null); }}
          companies={companies}
        />
      )}
      {selectedSupervisor && (
        <SupervisorDetailsModal
          supervisor={selectedSupervisor}
          onClose={() => setSelectedSupervisor(null)}
          onDelete={() => { deleteSupervisor(selectedSupervisor.id); setSelectedSupervisor(null); }}
          companies={companies}
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
