import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';
import { useAuth } from '../context/AuthContext';

function StatusPill({ status }) {
  const map = { approved:'pill-approved', pending:'pill-pending', pending_vendor:'pill-pending_vendor', pending_ceva:'pill-pending_ceva', rejected:'pill-rejected' };
  const label = { approved:'Approved', pending:'Pending', pending_vendor:'Vendor Review', pending_ceva:'Ceva Review', rejected:'Rejected', assigned:'Assigned' };
  return <span className={`status-pill ${map[status] || 'pill-pending'}`}>{label[status] || status}</span>;
}

function TwoFAModal({ smsCode, onVerify, onCancel }) {
  const [input, setInput] = useState('');
  const [err,   setErr]   = useState('');
  const handle = (e) => {
    e.preventDefault();
    if (input === smsCode) { onVerify(); }
    else { setErr('Incorrect verification code. Please try again.'); }
  };
  return (
    <div className="modal-overlay">
      <div className="modal-box slide-in">
        <div className="modal-title">Two-Factor Authentication</div>
        <div className="modal-desc">CEVA Admin 2FA verification is required before approving this sub-contractor routing.</div>
        <div>
          <div className="modal-code-display">{smsCode}</div>
          <div className="modal-code-label">Simulated SMS Code</div>
        </div>
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input className="modal-otp-input" type="text" maxLength={4} placeholder="----" value={input}
            onChange={e => { setInput(e.target.value); setErr(''); }} required autoFocus />
          {err && <div className="modal-error">{err}</div>}
          <div className="modal-actions">
            <button type="submit" className="btn-modal-confirm">Verify & Approve</button>
            <button type="button" className="btn-modal-cancel" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TruckAdminDashboard({ role, view }) {
  const {
    companies, verifyCompany,
    trucks, verifyTruck, registerTruck,
    drivers, verifyDriver, registerDriver,
    deliveries, assignDelivery,
    logs, alerts, resolveAlert,
    activeTruckHeadcount,
  } = useSystem();

  const { profile } = useAuth();

  const isCevaAdmin = role === 'ceva';

  /* 2FA */
  const [pending2FAId, setPending2FAId] = useState(null);
  const [smsCode,      setSmsCode]      = useState('');
  const trigger2FA = (id) => { setSmsCode(Math.floor(1000 + Math.random() * 9000).toString()); setPending2FAId(id); };
  const handle2FAVerify = () => { verifyCompany(pending2FAId, true); setPending2FAId(null); };

  /* Vendor selection */
  const approvedVendors = companies.filter(c => c.status === 'approved' && c.type === 'vendor');
  const approvedTrucking = companies.filter(c => c.status === 'approved' && c.type === 'trucking');

  // Multi-tenant isolation: Lock to user's assigned company and parent vendor
  const myCompanyId = profile?.company_id;
  const myCompany = companies.find(c => c.id === myCompanyId);
  const myParentCompanyId = myCompany?.parentCompanyId;

  const cargoAlerts = (alerts || []).filter(a => {
    if (a.resolved) return false;
    const delivery = deliveries.find(d => d.id === a.passId);
    if (delivery && delivery.companyId === myCompanyId) return true;
    return false;
  });

  const selTruckingId = myCompanyId || approvedTrucking[0]?.id || '';
  const selVendorId = myParentCompanyId || approvedVendors[0]?.id || '';

  /* Truck form */
  const [plate, setPlate] = useState(''); const [vin, setVin] = useState(''); const [model, setModel] = useState('');
  /* Driver form */
  const [driverName, setDriverName] = useState(''); const [license, setLicense] = useState('');
  /* Dispatch form */
  const [dispDriverId, setDispDriverId] = useState('');
  const [dispTruckId,  setDispTruckId]  = useState('');
  const [taskType,    setTaskType]     = useState('dropoff');
  const [seal,        setSeal]         = useState('');
  const [cargo,       setCargo]        = useState('');
  const [dispSealPhoto, setDispSealPhoto] = useState('');
  const [dispContainerPhoto, setDispContainerPhoto] = useState('');
  const [dispDestination, setDispDestination] = useState('CEVA Hub - Dock A');
  const [formMsg,     setFormMsg]      = useState('');

  /* Ceva data */
  const pendingCevaCompanies  = companies.filter(c => c.type === 'trucking' && c.status === 'pending_ceva');
  const activeDocked          = deliveries.filter(d => d.checkedIn && !d.checkedOut);
  const activeAlerts          = alerts.filter(a => !a.resolved && a.message.includes('TRUCK'));
  const tmsLogs               = logs.filter(l => l.type === 'truck').slice(0, 30);

  /* Vendor data */
  const subPending            = companies.filter(c => c.type === 'trucking' && c.parentCompanyId === selVendorId && c.status === 'pending_vendor');
  const companyTrucks         = trucks.filter(t => t.companyId === selTruckingId);
  const companyDrivers        = drivers.filter(d => d.companyId === selTruckingId);
  const pendingTrucks         = companyTrucks.filter(t => t.status === 'pending');
  const pendingDrivers        = companyDrivers.filter(d => d.status === 'pending');
  const approvedTrucksList    = companyTrucks.filter(t => t.status === 'approved');
  const approvedDriversList   = companyDrivers.filter(d => d.status === 'approved');
  const companyDeliveries     = deliveries.filter(d => d.companyId === selTruckingId);

  const handleRegisterTruck = (e) => {
    e.preventDefault();
    if (!plate || !vin || !model) return;
    registerTruck(plate, vin, model, selTruckingId);
    setPlate(''); setVin(''); setModel('');
    setFormMsg('Truck registered and pending verification.');
    setTimeout(() => setFormMsg(''), 4000);
  };

  const handleRegisterDriver = (e) => {
    e.preventDefault();
    if (!driverName || !license) return;
    registerDriver(driverName, license, selTruckingId);
    setDriverName(''); setLicense('');
    setFormMsg('Driver registered and pending verification.');
    setTimeout(() => setFormMsg(''), 4000);
  };

  const handleDispatch = (e) => {
    e.preventDefault();
    if (!dispDriverId || !dispTruckId || !seal || !dispContainerPhoto || !dispSealPhoto) {
      setFormMsg('Driver, truck, seal number, container photo, and seal photo are all required.');
      return;
    }
    assignDelivery(dispTruckId, dispDriverId, selTruckingId, taskType, seal, dispSealPhoto, cargo, dispContainerPhoto, dispDestination);
    setDispDriverId(''); setDispTruckId(''); setSeal(''); setCargo('');
    setDispSealPhoto(''); setDispContainerPhoto(''); setDispDestination('CEVA Hub - Dock A');
    setFormMsg('Delivery dispatched successfully.');
    setTimeout(() => setFormMsg(''), 4000);
  };

  /* ─── CEVA ADMIN VIEW ─────────────────────────────────────────── */
  if (isCevaAdmin) {
    return (
      <>
        {pending2FAId && (
          <TwoFAModal smsCode={smsCode} onVerify={handle2FAVerify} onCancel={() => setPending2FAId(null)} />
        )}

        <div className="page-header">
          <div className="page-title-block">
            <div className="page-title">Truck & Cargo Admin</div>
            <div className="page-subtitle">Trucking company approvals, live dock status, and cargo gate inspection logs</div>
          </div>
          <span className="page-header-badge badge-ceva">Ceva Admin Portal</span>
        </div>

        {/* Stats */}
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
              <div className="stat-value">{pendingCevaCompanies.length}</div>
              <div className="stat-label">Pending 2FA Approvals</div>
            </div>
          </div>
        </div>

        {activeAlerts.length > 0 && (
          <div className="alert-banner" style={{ marginBottom: 20 }}>
            <div className="alert-banner-label pulse-text">Critical Logistics Alerts</div>
            {activeAlerts.map(a => (
              <div key={a.id} className="alert-item">
                <div>
                  <div className="alert-item-text">{a.message}</div>
                  <div className="alert-item-time">Triggered: {a.timestamp}</div>
                </div>
                <button className="btn-action btn-reject" onClick={() => resolveAlert(a.id)}>Acknowledge</button>
              </div>
            ))}
          </div>
        )}

        <div className="content-grid">
          <div>
            {/* Trucking Company Approvals */}
            <div className="panel" style={{ marginBottom: 20 }}>
              <div className="panel-header">
                <span className="panel-title">Trucking Company 2FA Approvals</span>
                <span className="panel-badge">{pendingCevaCompanies.length} Pending</span>
              </div>
              {pendingCevaCompanies.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-title">No Pending Companies</div>
                    <div className="empty-state-desc">All trucking company applications have been processed.</div>
                  </div>
                </div>
              ) : (
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead>
                      <tr><th>Company</th><th>Parent Vendor</th><th>Contact</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {pendingCevaCompanies.map(c => {
                        const parent = companies.find(p => p.id === c.parentCompanyId);
                        return (
                          <tr key={c.id}>
                            <td><div className="cell-primary">{c.name}</div></td>
                            <td><div className="cell-secondary">{parent?.name || 'Independent'}</div></td>
                            <td><div className="cell-secondary">{c.email}</div></td>
                            <td>
                              <div className="actions-cell">
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

            {/* Live Cargo Dock */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Live Cargo Dock Status</span>
                <span className="panel-badge">{activeDocked.length} Docked</span>
              </div>
              {activeDocked.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-title">No Trucks Currently Docked</div>
                    <div className="empty-state-desc">All bays are currently unoccupied.</div>
                  </div>
                </div>
              ) : (
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead>
                      <tr><th>Operation</th><th>Plate</th><th>Seal #</th><th>Driver</th><th>Cargo</th></tr>
                    </thead>
                    <tbody>
                      {activeDocked.map(d => {
                        const trk = trucks.find(t => t.id === d.truckId);
                        const drv = drivers.find(dr => dr.id === d.driverId);
                        return (
                          <tr key={d.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="live-dot" />
                                <span className="cell-primary" style={{ textTransform: 'uppercase' }}>{d.type}</span>
                              </div>
                            </td>
                            <td><div className="cell-mono cell-primary">{trk?.plate || 'N/A'}</div></td>
                            <td><div className="cell-mono cell-secondary">{d.sealNumber}</div></td>
                            <td><div className="cell-secondary">{drv?.name || 'N/A'}</div></td>
                            <td><div className="cell-secondary">{d.items}</div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right — Log console */}
          <div>
            <div className="log-console-panel">
              <div className="log-console-header">
                <div className="log-live-dot" />
                <span className="log-console-label">Cargo Gate Inspection Log</span>
              </div>
              <div className="log-console-body" style={{ height: 360 }}>
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
          </div>
        </div>
      </>
    );
  }

  /* ─── VENDOR / FLEET ADMIN VIEW ───────────────────────────────── */
  const TenantBar = () => (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20, background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Parent Vendor Broker:</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', background: '#e0f2fe', padding: '2px 8px', borderRadius: 4 }}>
          {companies.find(c => c.id === selVendorId)?.name || 'Independent Carrier'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Carrier (3PL Company):</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', background: '#f3e8ff', padding: '2px 8px', borderRadius: 4 }}>
          {companies.find(c => c.id === selTruckingId)?.name || 'Unassigned Carrier'}
        </span>
      </div>
    </div>
  );

  /* ── FLEET OVERVIEW ── */
  if (view === 'overview' || !view) {
    return (
      <>
        <div className="page-header">
          <div className="page-title-block">
            <div className="page-title">Fleet Overview</div>
            <div className="page-subtitle">Live snapshot of your fleet assets, active dispatches, and pending verifications</div>
          </div>
          <span className="page-header-badge badge-trucking">Fleet Admin</span>
        </div>

        {/* Critical Security Alerts */}
        {cargoAlerts.length > 0 && (
          <div className="alert-banner" style={{ marginBottom: 20 }}>
            <div className="alert-banner-label pulse-text">Critical Security Alerts ({cargoAlerts.length})</div>
            {cargoAlerts.map(a => (
              <div key={a.id} className="alert-item">
                <div>
                  <div className="alert-item-text">{a.message}</div>
                  <div className="alert-item-time">Logged: {a.timestamp || new Date(a.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <TenantBar />
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 3h15v13H1V3zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
            </div>
            <div className="stat-body">
              <div className="stat-value">{companyTrucks.length}</div>
              <div className="stat-label">Registered Trucks</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
            </div>
            <div className="stat-body">
              <div className="stat-value">{companyDrivers.length}</div>
              <div className="stat-label">Registered Drivers</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
            </div>
            <div className="stat-body">
              <div className="stat-value">{pendingTrucks.length + pendingDrivers.length}</div>
              <div className="stat-label">Pending Verifications</div>
            </div>
          </div>
        </div>
        {/* Fleet Roster summary */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Fleet Roster</span>
            <span className="panel-badge">{companyTrucks.length} Trucks / {companyDrivers.length} Drivers</span>
          </div>
          {companyTrucks.length === 0 && companyDrivers.length === 0 ? (
            <div className="panel-body">
              <div className="empty-state">
                <div className="empty-state-title">No Fleet Assets</div>
                <div className="empty-state-desc">Register trucks and drivers from the sidebar sections.</div>
              </div>
            </div>
          ) : (
            <div className="panel-body-flush">
              <table className="data-table">
                <thead>
                  <tr><th>Asset</th><th>Details</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {companyTrucks.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div className="cell-primary">{t.plate}</div>
                        <div style={{ fontSize: '0.68rem', background: 'rgba(0,32,72,0.06)', color: 'var(--ceva-blue)', padding: '1px 6px', borderRadius: 3, display: 'inline-block', marginTop: 2 }}>TRUCK</div>
                      </td>
                      <td>
                        <div className="cell-secondary">{t.model}</div>
                        <div className="cell-mono cell-secondary" style={{ fontSize: '0.72rem' }}>{t.vin}</div>
                      </td>
                      <td><StatusPill status={t.status} /></td>
                    </tr>
                  ))}
                  {companyDrivers.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div className="cell-with-avatar">
                          {d.photo ? <img src={d.photo} alt={d.name} className="cell-avatar" /> : <div className="cell-avatar-initials">{d.name?.[0]}</div>}
                          <div>
                            <div className="cell-primary">{d.name}</div>
                            <div style={{ fontSize: '0.68rem', background: 'rgba(109,40,217,0.07)', color: 'var(--vendor-purple)', padding: '1px 6px', borderRadius: 3, display: 'inline-block', marginTop: 2 }}>DRIVER</div>
                          </div>
                        </div>
                      </td>
                      <td><div className="cell-mono cell-secondary">{d.license}</div></td>
                      <td><StatusPill status={d.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Cargo Dispatches */}
        <div className="panel" style={{ marginTop: 20 }}>
          <div className="panel-header">
            <span className="panel-title">Active Cargo Dispatches</span>
            <span className="panel-badge">{companyDeliveries.length} Total</span>
          </div>
          {companyDeliveries.length === 0 ? (
            <div className="panel-body">
              <div className="empty-state">
                <div className="empty-state-title">No Active Dispatches</div>
                <div className="empty-state-desc">Assign dispatches in the "Dispatch" section. They will appear here once assigned.</div>
              </div>
            </div>
          ) : (
            <div className="panel-body-flush">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Dispatch ID</th>
                    <th>Type</th>
                    <th>Truck/Driver</th>
                    <th>Seal / Cargo</th>
                    <th>Status</th>
                    <th>Security Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {companyDeliveries.map(d => {
                    const trk = trucks.find(t => t.id === d.truckId);
                    const drv = drivers.find(drv => drv.id === d.driverId);
                    const activeAlert = alerts.find(a => a.passId === d.id && !a.resolved);
                    return (
                      <tr key={d.id}>
                        <td><div className="cell-mono cell-secondary">#{d.id.slice(-6)}</div></td>
                        <td><span style={{ textTransform: 'capitalize', fontWeight: 600, color: d.type === 'dropoff' ? '#0891b2' : '#7c3aed', fontSize: '0.8rem' }}>{d.type}</span></td>
                        <td>
                          <div className="cell-primary">{drv?.name || 'Unknown'}</div>
                          <div className="cell-secondary" style={{ fontFamily: 'monospace' }}>{trk?.plate || 'Unknown'}</div>
                        </td>
                        <td>
                          <div className="cell-primary" style={{ fontFamily: 'monospace' }}>{d.sealNumber}</div>
                          <div className="cell-secondary">{d.items || '—'}</div>
                        </td>
                        <td>
                          <span className={`status-pill ${d.status === 'checked_in' ? 'pill-approved' : d.status === 'checked_out' ? 'pill-pending_ceva' : 'pill-pending'}`}>
                            {d.status === 'checked_in' ? 'On-Site' : d.status === 'checked_out' ? 'Departed' : 'Assigned'}
                          </span>
                        </td>
                        <td>
                          {activeAlert ? (
                            <span className="status-pill status-rejected" style={{ background: '#ef4444', color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>
                              ⚠️ {activeAlert.type.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="status-pill status-approved">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  }

  /* ── TRUCKS REGISTER & VERIFY ── */
  if (view === 'trucks') {
    return (
      <>
        <div className="page-header">
          <div className="page-title-block">
            <div className="page-title">Trucks</div>
            <div className="page-subtitle">Register new fleet trucks and verify pending assets</div>
          </div>
          <span className="page-header-badge badge-trucking">Fleet Admin</span>
        </div>
        <TenantBar />
        <div className="content-grid">
          <div>
            {/* Pending Truck Verification */}
            <div className="panel" style={{ marginBottom: 20 }}>
              <div className="panel-header">
                <span className="panel-title">Pending Asset Verification</span>
                <span className="panel-badge">{pendingTrucks.length} Pending</span>
              </div>
              {pendingTrucks.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-title">All Trucks Verified</div>
                    <div className="empty-state-desc">No trucks are awaiting verification.</div>
                  </div>
                </div>
              ) : (
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead><tr><th>Asset</th><th>Details</th><th>Actions</th></tr></thead>
                    <tbody>
                      {pendingTrucks.map(t => (
                        <tr key={t.id}>
                          <td>
                            <div className="cell-primary">{t.plate}</div>
                            <div style={{ fontSize: '0.68rem', background: 'rgba(0,32,72,0.06)', color: 'var(--ceva-blue)', padding: '1px 6px', borderRadius: 3, display: 'inline-block', marginTop: 2 }}>TRUCK</div>
                          </td>
                          <td>
                            <div className="cell-secondary">{t.model}</div>
                            <div className="cell-mono cell-secondary">{t.vin}</div>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-action btn-approve" onClick={() => verifyTruck(t.id, true)}>Verify</button>
                              <button className="btn-action btn-reject" onClick={() => verifyTruck(t.id, false)}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Verified Trucks Roster */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Verified Trucks Roster</span>
                <span className="panel-badge">{approvedTrucksList.length} Verified</span>
              </div>
              {approvedTrucksList.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-title">No Verified Trucks</div>
                    <div className="empty-state-desc">All registered trucks will appear here once verified.</div>
                  </div>
                </div>
              ) : (
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead><tr><th>Plate</th><th>Model / VIN</th><th>Status</th></tr></thead>
                    <tbody>
                      {approvedTrucksList.map(t => (
                        <tr key={t.id}>
                          <td><div className="cell-primary" style={{ fontFamily: 'monospace' }}>{t.plate}</div></td>
                          <td>
                            <div className="cell-secondary">{t.model}</div>
                            <div className="cell-mono cell-secondary" style={{ fontSize: '0.7rem' }}>{t.vin}</div>
                          </td>
                          <td><span className="status-pill pill-approved">Approved</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div>
            {/* Register Truck Form */}
            <div className="form-panel">
              <div className="form-panel-header">
                <div className="form-panel-title">Register Fleet Truck</div>
              </div>
              <div className="form-panel-body">
                <form onSubmit={handleRegisterTruck} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="fields-row">
                    <div className="field-group">
                      <label>License Plate *</label>
                      <input type="text" placeholder="TX-8821" value={plate} onChange={e => setPlate(e.target.value)} required />
                    </div>
                    <div className="field-group">
                      <label>Truck Model *</label>
                      <input type="text" placeholder="Freightliner Cascadia" value={model} onChange={e => setModel(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>VIN *</label>
                    <input type="text" placeholder="1FVAC54Y3G892..." value={vin} onChange={e => setVin(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary">Add Truck</button>
                  {formMsg && <div className="form-feedback-success">{formMsg}</div>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── DRIVERS REGISTER & VERIFY ── */
  if (view === 'drivers') {
    return (
      <>
        <div className="page-header">
          <div className="page-title-block">
            <div className="page-title">Drivers</div>
            <div className="page-subtitle">Register CDL-licensed drivers and approve pending verifications</div>
          </div>
          <span className="page-header-badge badge-trucking">Fleet Admin</span>
        </div>
        <TenantBar />
        <div className="content-grid">
          <div>
            {/* Pending Driver Verification */}
            <div className="panel" style={{ marginBottom: 20 }}>
              <div className="panel-header">
                <span className="panel-title">Pending Driver Verification</span>
                <span className="panel-badge">{pendingDrivers.length} Pending</span>
              </div>
              {pendingDrivers.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-title">All Drivers Verified</div>
                    <div className="empty-state-desc">No drivers are awaiting verification.</div>
                  </div>
                </div>
              ) : (
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead><tr><th>Driver</th><th>License</th><th>Actions</th></tr></thead>
                    <tbody>
                      {pendingDrivers.map(d => (
                        <tr key={d.id}>
                          <td>
                            <div className="cell-with-avatar">
                              {d.photo ? <img src={d.photo} alt={d.name} className="cell-avatar" /> : <div className="cell-avatar-initials">{d.name?.[0]}</div>}
                              <div className="cell-primary">{d.name}</div>
                            </div>
                          </td>
                          <td><div className="cell-mono cell-secondary">{d.license}</div></td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-action btn-approve" onClick={() => verifyDriver(d.id, true)}>Verify</button>
                              <button className="btn-action btn-reject" onClick={() => verifyDriver(d.id, false)}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Verified Drivers Roster */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Verified Drivers Roster</span>
                <span className="panel-badge">{approvedDriversList.length} Verified</span>
              </div>
              {approvedDriversList.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-title">No Verified Drivers</div>
                    <div className="empty-state-desc">All registered drivers will appear here once verified.</div>
                  </div>
                </div>
              ) : (
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead><tr><th>Driver</th><th>CDL License</th><th>Status</th></tr></thead>
                    <tbody>
                      {approvedDriversList.map(d => (
                        <tr key={d.id}>
                          <td>
                            <div className="cell-with-avatar">
                              {d.photo ? <img src={d.photo} alt={d.name} className="cell-avatar" /> : <div className="cell-avatar-initials">{d.name?.[0]}</div>}
                              <div className="cell-primary">{d.name}</div>
                            </div>
                          </td>
                          <td><div className="cell-mono cell-secondary">{d.license}</div></td>
                          <td><span className="status-pill pill-approved">Approved</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div>
            {/* Register Driver Form */}
            <div className="form-panel">
              <div className="form-panel-header">
                <div className="form-panel-title">Register Driver</div>
              </div>
              <div className="form-panel-body">
                <form onSubmit={handleRegisterDriver} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="fields-row">
                    <div className="field-group">
                      <label>Full Name *</label>
                      <input type="text" placeholder="Marcus Miller" value={driverName} onChange={e => setDriverName(e.target.value)} required />
                    </div>
                    <div className="field-group">
                      <label>CDL License # *</label>
                      <input type="text" placeholder="DL-99210" value={license} onChange={e => setLicense(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">Add Driver</button>
                  {formMsg && <div className="form-feedback-success">{formMsg}</div>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── DISPATCH ── */
  if (view === 'dispatch') {
    return (
      <>
        <div className="page-header">
          <div className="page-title-block">
            <div className="page-title">Dispatch</div>
            <div className="page-subtitle">Assign verified drivers and trucks to cargo delivery or pickup operations</div>
          </div>
          <span className="page-header-badge badge-trucking">Fleet Admin</span>
        </div>
        <TenantBar />
        <div className="content-grid">
          <div>
            {/* Active Cargo Dispatches */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Active Cargo Dispatches</span>
                <span className="panel-badge">{companyDeliveries.length} Total</span>
              </div>
              {companyDeliveries.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-title">No Active Dispatches</div>
                    <div className="empty-state-desc">Assign cargo operations using the form on the right.</div>
                  </div>
                </div>
              ) : (
                <div className="panel-body-flush">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Dispatch ID</th>
                        <th>Type</th>
                        <th>Truck/Driver</th>
                        <th>Seal / Cargo</th>
                        <th>Status</th>
                        <th>Security Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyDeliveries.map(d => {
                        const trk = trucks.find(t => t.id === d.truckId);
                        const drv = drivers.find(drv => drv.id === d.driverId);
                        const activeAlert = alerts.find(a => a.passId === d.id && !a.resolved);
                        return (
                          <tr key={d.id}>
                            <td><div className="cell-mono cell-secondary">#{d.id.slice(-6)}</div></td>
                            <td><span style={{ textTransform: 'capitalize', fontWeight: 600, color: d.type === 'dropoff' ? '#0891b2' : '#7c3aed', fontSize: '0.8rem' }}>{d.type}</span></td>
                            <td>
                              <div className="cell-primary">{drv?.name || 'Unknown'}</div>
                              <div className="cell-secondary" style={{ fontFamily: 'monospace' }}>{trk?.plate || 'Unknown'}</div>
                            </td>
                            <td>
                              <div className="cell-primary" style={{ fontFamily: 'monospace' }}>{d.sealNumber}</div>
                              <div className="cell-secondary">{d.items || '—'}</div>
                            </td>
                            <td>
                              <span className={`status-pill ${d.status === 'checked_in' ? 'pill-approved' : d.status === 'checked_out' ? 'pill-pending_ceva' : 'pill-pending'}`}>
                                {d.status === 'checked_in' ? 'On-Site' : d.status === 'checked_out' ? 'Departed' : 'Assigned'}
                              </span>
                            </td>
                            <td>
                              {activeAlert ? (
                                <span className="status-pill status-rejected" style={{ background: '#ef4444', color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>
                                  ⚠️ {activeAlert.type.replace('_', ' ')}
                                </span>
                              ) : (
                                <span className="status-pill status-approved">Normal</span>
                              )}
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
          <div>
            <div className="form-panel">
              <div className="form-panel-header">
                <div className="form-panel-title">Assign Delivery / Pickup Task</div>
                <div className="form-panel-desc">Assign a verified driver and truck to a cargo operation.</div>
              </div>
              <div className="form-panel-body">
                <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="fields-row">
                    <div className="field-group">
                      <label>Select Driver</label>
                      <select value={dispDriverId} onChange={e => setDispDriverId(e.target.value)} required>
                        <option value="">-- Choose Driver --</option>
                        {approvedDriversList.map(d => <option key={d.id} value={d.id}>{d.name} ({d.license})</option>)}
                      </select>
                    </div>
                    <div className="field-group">
                      <label>Select Truck</label>
                      <select value={dispTruckId} onChange={e => setDispTruckId(e.target.value)} required>
                        <option value="">-- Choose Truck --</option>
                        {approvedTrucksList.map(t => <option key={t.id} value={t.id}>{t.plate} ({t.model})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="fields-row">
                    <div className="field-group">
                      <label>Task Type</label>
                      <select value={taskType} onChange={e => setTaskType(e.target.value)}>
                        <option value="dropoff">Inbound Drop-off</option>
                        <option value="pickup">Outbound Pickup</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>Container Seal # *</label>
                      <input type="text" placeholder="SEAL-55441" value={seal} onChange={e => setSeal(e.target.value)} required />
                    </div>
                  </div>
                  <div className="fields-row">
                    <div className="field-group">
                      <label>Cargo Description</label>
                      <input type="text" placeholder="Electronics Batch 4A" value={cargo} onChange={e => setCargo(e.target.value)} />
                    </div>
                    <div className="field-group">
                      <label>Destination Facility Dropoff *</label>
                      <select value={dispDestination} onChange={e => setDispDestination(e.target.value)} required>
                        <option value="CEVA Hub - Dock A">CEVA Hub - Dock A</option>
                        <option value="CEVA Hub - Dock B">CEVA Hub - Dock B</option>
                        <option value="CEVA Hub - Dock C">CEVA Hub - Dock C</option>
                        <option value="CEVA Hub - Dock D">CEVA Hub - Dock D</option>
                      </select>
                    </div>
                  </div>

                  <div className="fields-row">
                    <div className="field-group">
                      <label>Container Photo *</label>
                      <div className="photo-upload-zone">
                        {dispContainerPhoto ? (
                          <div className="photo-upload-preview-wrap">
                            <img src={dispContainerPhoto} className="photo-upload-preview" alt="Container" />
                            <button type="button" className="photo-upload-remove-btn" onClick={() => setDispContainerPhoto('')}>&times;</button>
                          </div>
                        ) : (
                          <>
                            <div className="photo-upload-text"><strong>Upload Container Photo</strong></div>
                            <span style={{ fontSize: '0.65rem' }}>Click or drag file</span>
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
                              reader.onloadend = () => setDispContainerPhoto(reader.result);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label>Seal Photo *</label>
                      <div className="photo-upload-zone">
                        {dispSealPhoto ? (
                          <div className="photo-upload-preview-wrap">
                            <img src={dispSealPhoto} className="photo-upload-preview" alt="Seal" />
                            <button type="button" className="photo-upload-remove-btn" onClick={() => setDispSealPhoto('')}>&times;</button>
                          </div>
                        ) : (
                          <>
                            <div className="photo-upload-text"><strong>Upload Seal Photo</strong></div>
                            <span style={{ fontSize: '0.65rem' }}>Click or drag file</span>
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
                              reader.onloadend = () => setDispSealPhoto(reader.result);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button type="submit" className="btn-primary">Dispatch Assigned Driver</button>
                  {formMsg && <div className="form-feedback-success">{formMsg}</div>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* Fallback — default to overview */
  return null;
}
