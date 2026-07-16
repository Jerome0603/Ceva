import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

export default function WorkerMobileApp() {
  const { 
    companies, 
    workers, 
    registerWorker, 
    passes, 
    requestPass,
    supervisors,
    alerts = []
  } = useSystem();

  // Active Worker Session State
  const [activeWorkerId, setActiveWorkerId] = useState('');
  const [activeTab, setActiveTab] = useState('pass'); // 'pass' or 'register'
  const [passSupervisorName, setPassSupervisorName] = useState('');

  // New Worker Form (Mobile App Mode)
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [regMsg, setRegMsg] = useState('');

  // Pass Request Form
  const [zone, setZone] = useState('Zone A - Warehouse Floor');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [purpose, setPurpose] = useState('');
  const [passMsg, setPassMsg] = useState('');

  // Reminder State
  const [reminderActive, setReminderActive] = useState(false);

  const approvedCompanies = companies.filter(c => c.status === 'approved');
  const currentWorker = workers.find(w => w.id === activeWorkerId);
  const workerPasses = passes.filter(p => p.workerId === activeWorkerId);

  // Get active approved pass
  const activeApprovedPass = workerPasses.find(p => p.status === 'approved');
  const activePassAlert = activeApprovedPass && alerts.find(a => !a.resolved && a.type === 'overstay' && a.passId === activeApprovedPass.id);

  const handleRegister = (e) => {
    e.preventDefault();
    if (!companyId) {
      setRegMsg('Please select a verified company.');
      return;
    }
    if (!name) {
      setRegMsg('Name is required.');
      return;
    }
    const newW = registerWorker(
      name, 
      companyId, 
      'Pending Assignment', 
      email || `${name.toLowerCase().replace(/\s+/g, '')}@vendor.com`, 
      phone || '+1 555-4321',
      photo
    );
    setActiveWorkerId(newW.id);
    setName('');
    setEmail('');
    setPhone('');
    setPhoto('');
    setRegMsg('Profile submitted! Waiting for Company Admin verification.');
    setActiveTab('pass');
    setTimeout(() => setRegMsg(''), 4000);
  };

  const handleRequestPass = (e) => {
    e.preventDefault();
    if (!activeWorkerId) return;
    if (currentWorker.status !== 'approved') {
      setPassMsg('Your profile must be verified by your Company Admin before requesting a pass.');
      return;
    }
    if (!purpose) {
      setPassMsg('Please state the purpose of your visit.');
      return;
    }
    
    requestPass(activeWorkerId, zone, startDate, endDate, startTime, endTime, purpose, passSupervisorName);
    setPurpose('');
    setPassSupervisorName('');
    setPassMsg('Pass request submitted! Dual-approval workflow started.');
    setTimeout(() => setPassMsg(''), 4000);
  };

  return (
    <div className="mobile-app-wrapper">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-status-bar">
          <span>9:41 AM</span>
          <div className="status-icons">📶 🔋</div>
        </div>
        <div className="mobile-title">
          <span>Ceva Pass Mobile</span>
        </div>
      </div>

      {/* Select Worker Profile */}
      <div className="mobile-session-selector">
        <label>Active User Profile:</label>
        <select 
          value={activeWorkerId} 
          onChange={(e) => {
            setActiveWorkerId(e.target.value);
            setReminderActive(false);
          }}
          className="mobile-select"
        >
          <option value="">-- Guest (Not Logged In) --</option>
          {workers.map(w => {
            const compName = companies.find(c => c.id === w.companyId)?.name || 'Unknown Company';
            return (
              <option key={w.id} value={w.id}>
                {w.name} ({compName})
              </option>
            );
          })}
        </select>
      </div>

      {/* Main Tab Switcher */}
      <div className="mobile-tabs">
        <button 
          className={`mobile-tab-btn ${activeTab === 'pass' ? 'active' : ''}`}
          onClick={() => setActiveTab('pass')}
        >
          Gate Passes
        </button>
        <button 
          className={`mobile-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          Register Profile
        </button>
      </div>

      {/* Mobile Content Area */}
      <div className="mobile-content">
        {activeTab === 'register' && (
          <div className="mobile-form-container">
            <h3>Worker Registration</h3>
            <form onSubmit={handleRegister}>
              <div className="mobile-input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="Carlos Santana" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>
              <div className="mobile-input-group">
                <label>Company</label>
                <select 
                  value={companyId} 
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="mobile-select"
                  required
                >
                  <option value="">-- Choose Company --</option>
                  {approvedCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="mobile-input-group">
                <label>Email</label>
                <input 
                  type="email" 
                  placeholder="carlos@vendor.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
              <div className="mobile-input-group">
                <label>Phone</label>
                <input 
                  type="text" 
                  placeholder="+1 555-0000" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>
              <div className="mobile-input-group">
                <label>Profile Photo</label>
                <div className="mobile-photo-upload-zone">
                  {photo ? (
                    <div className="photo-upload-preview-wrap" style={{ width: 64, height: 64 }}>
                      <img src={photo} className="photo-upload-preview" style={{ width: 64, height: 64 }} alt="Preview" />
                      <button type="button" className="photo-upload-remove-btn" onClick={() => setPhoto('')}>&times;</button>
                    </div>
                  ) : (
                    <>
                      <div className="mobile-photo-upload-text">
                        <strong>Tap to upload photo</strong>
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>PNG or JPG</span>
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
                        reader.onloadend = () => setPhoto(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
              <button type="submit" className="mobile-btn">Submit Profile</button>
              {regMsg && <p className="mobile-feedback">{regMsg}</p>}
            </form>
          </div>
        )}

        {activeTab === 'pass' && (
          <div className="mobile-pass-area">
            {!activeWorkerId ? (
              <div className="mobile-login-hint">
                <p>Welcome! Please select your profile from the dropdown above or register a new one to apply for a gate pass.</p>
              </div>
            ) : (
              <>
                {/* Profile Verification Status */}
                <div className={`worker-status-badge status-${currentWorker?.status}`}>
                  Profile Status: {currentWorker?.status?.toUpperCase() || 'UNKNOWN'}
                </div>

                {currentWorker?.status !== 'approved' ? (
                  <div className="mobile-login-hint">
                    <p className="warning-text">⚠️ Your profile registration is pending review by your company admin. You cannot apply for a pass yet.</p>
                  </div>
                ) : (
                  <>
                    {/* Active/Issued Digital Pass Display */}
                    {activeApprovedPass ? (
                      <>
                        {activePassAlert && (
                          <div style={{
                            background: '#fef2f2',
                            border: '2px solid #ef4444',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            color: '#991b1b',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            marginBottom: '16px',
                            lineHeight: 1.4
                          }}>
                            ⚠️ SECURITY WARNING: You have exceeded your permitted zone access time! Please exit immediately and report to the security desk.
                          </div>
                        )}
                        <div className="digital-pass-card">
                          <div className="pass-header">
                            <span className="pass-title">DIGITAL GATE PASS</span>
                            <span className="pass-id-num">Pass #{activeApprovedPass.id.slice(-6)}</span>
                          </div>
                          
                          <div className="pass-body">
                            <div className="pass-photo-wrap">
                              {currentWorker.photo ? (
                                <img src={currentWorker.photo} alt={currentWorker.name} className="pass-avatar" />
                              ) : (
                                <div className="pass-avatar-placeholder">
                                  {currentWorker.name?.[0]?.toUpperCase() || 'W'}
                                </div>
                              )}
                              <div className="pass-name">
                                <h4>{currentWorker.name}</h4>
                                <p className="pass-vendor">{companies.find(c => c.id === currentWorker.companyId)?.name}</p>
                              </div>
                            </div>

                            {/* Real QR Code Generated dynamically */}
                            {(() => {
                              const shortPassId = activeApprovedPass.id.slice(-6);
                              const qrPayload = `CEVA LOGISTICS GATE PASS
  -------------------------
  Pass ID: #${shortPassId}
  Name: ${currentWorker.name}
  Company: ${companies.find(c => c.id === currentWorker.companyId)?.name || 'Vendor'}
  Zone: ${activeApprovedPass.zoneLevel.split(' - ')[0]}
  Validity: ${activeApprovedPass.startDate} to ${activeApprovedPass.endDate}
  Hours: ${activeApprovedPass.startTime.slice(0, 5)} - ${activeApprovedPass.endTime.slice(0, 5)}
  -------------------------
  STATUS: VERIFIED ENTRY APPROVED`;
                              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;
                              return (
                                <div className="qr-box-sim">
                                  <img src={qrUrl} alt="Gate Pass QR Code" style={{ width: 116, height: 116, display: 'block' }} />
                                </div>
                              );
                            })()}

                            <div className="pass-info-grid">
                              <div className="pass-info-item">
                                <span>ZONE</span>
                                <strong>{activeApprovedPass.zoneLevel.split(' - ')[0]}</strong>
                              </div>
                              <div className="pass-info-item">
                                <span>HOURS</span>
                                <strong>{activeApprovedPass.startTime.slice(0, 5)} - {activeApprovedPass.endTime.slice(0, 5)}</strong>
                              </div>
                              <div className="pass-info-item" style={{ gridColumn: 'span 2' }}>
                                <span>VALID DATES</span>
                                <strong>{activeApprovedPass.startDate} to {activeApprovedPass.endDate}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Reminders Option */}
                          <div className="reminder-box">
                            <button 
                              className={`btn-reminder-toggle ${reminderActive ? 'active' : ''}`}
                              onClick={() => setReminderActive(!reminderActive)}
                            >
                              ⏰ {reminderActive ? 'Reminder Set (30m Remaining)' : 'Simulate 30m Time Reminder'}
                            </button>
                            {reminderActive && (
                              <div className="reminder-alert-toast slide-in">
                                <strong>🔔 In-App Reminder:</strong> Your shift ends in 30 minutes! Please plan your exit.
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Request Pass Form */
                      <div className="mobile-form-container">
                        <h3>Request Gate Pass</h3>
                        <form onSubmit={handleRequestPass}>
                          <div className="mobile-input-group">
                            <label>Authorized Zone Level</label>
                            <select 
                              value={zone} 
                              onChange={(e) => setZone(e.target.value)}
                              className="mobile-select"
                            >
                              <option value="Zone A - Warehouse Floor">Zone A - Warehouse Floor</option>
                              <option value="Zone B - Cargo Loading">Zone B - Cargo Loading</option>
                               <option value="Zone C - Admin Office">Zone C - Admin Office</option>
                            </select>
                          </div>
                          
                          {/* Designated Supervisor Dropdown */}
                          <div className="mobile-input-group">
                            <label>Designated Supervisor</label>
                            <select 
                              value={passSupervisorName} 
                              onChange={(e) => setPassSupervisorName(e.target.value)}
                              className="mobile-select"
                              required
                            >
                              <option value="">-- Select Approved Supervisor --</option>
                              {supervisors
                                .filter(s => s.companyId === currentWorker?.companyId && s.status === 'approved')
                                .map(s => (
                                  <option key={s.id} value={s.name}>{s.name} ({s.email})</option>
                                ))
                              }
                            </select>
                          </div>

                          <div className="mobile-input-group">
                            <label>Start Date</label>
                            <input 
                              type="date" 
                              value={startDate} 
                              onChange={(e) => setStartDate(e.target.value)} 
                              required
                            />
                          </div>
                          <div className="mobile-input-group">
                            <label>End Date</label>
                            <input 
                              type="date" 
                              value={endDate} 
                              onChange={(e) => setEndDate(e.target.value)} 
                              required
                            />
                          </div>
                          <div className="mobile-input-row">
                            <div className="mobile-input-group">
                              <label>Start Time</label>
                              <input 
                                type="time" 
                                value={startTime} 
                                onChange={(e) => setStartTime(e.target.value)} 
                                required
                              />
                            </div>
                            <div className="mobile-input-group">
                              <label>End Time</label>
                              <input 
                                type="time" 
                                value={endTime} 
                                onChange={(e) => setEndTime(e.target.value)} 
                                required
                              />
                            </div>
                          </div>
                          <div className="mobile-input-group">
                            <label>Purpose of Visit</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Electrical maintenance" 
                              value={purpose} 
                              onChange={(e) => setPurpose(e.target.value)} 
                              required
                            />
                          </div>
                          <button type="submit" className="mobile-btn">Submit Request</button>
                          {passMsg && <p className="mobile-feedback">{passMsg}</p>}
                        </form>
                      </div>
                    )}

                    {/* Visit Requests Status List */}
                    {workerPasses.length > 0 && (
                      <div className="mobile-pass-history">
                        <h4>Application History</h4>
                        {workerPasses.map(p => (
                          <div key={p.id} className="history-item">
                            <div className="history-details">
                              <strong>#{p.id.slice(-6)}: {p.zoneLevel.split(' - ')[0]}</strong>
                              <span>{p.startDate} | {p.startTime}-{p.endTime}</span>
                            </div>
                            <div className={`history-status status-${p.status}`}>
                              {p.status === 'pending_vendor' && 'Pending Vendor'}
                              {p.status === 'pending_ceva' && 'Pending Ceva'}
                              {p.status === 'approved' && 'Approved'}
                              {p.status === 'rejected' && 'Rejected'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
