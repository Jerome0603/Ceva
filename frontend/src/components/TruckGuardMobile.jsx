import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

export default function TruckGuardMobile() {
  const {
    deliveries,
    trucks,
    drivers,
    companies,
    checkInTruck,
    checkOutTruck,
    activeTruckHeadcount,
    triggerTruckOverstay,
    triggerSealMismatch,
    alerts
  } = useSystem();

  // Scan states
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [ocrVerified, setOcrVerified] = useState(false);
  const [photoVerified, setPhotoVerified] = useState(false);
  const [sealVerified, setSealVerified] = useState(false);
  const [hasCapturedPhotos, setHasCapturedPhotos] = useState(false);

  // checkout state
  const [checkoutDeliveryId, setCheckoutDeliveryId] = useState('');
  const [exitOcrVerified, setExitOcrVerified] = useState(false);
  const [exitPhotoVerified, setExitPhotoVerified] = useState(false);
  const [exitSealVerified, setExitSealVerified] = useState(false);
  const [hasCapturedExitPhotos, setHasCapturedExitPhotos] = useState(false);

  // Custom Mismatch Dialog State
  const [showMismatchDialog, setShowMismatchDialog] = useState(false);
  const [mismatchDeliveryId, setMismatchDeliveryId] = useState('');
  const [observedSealNumber, setObservedSealNumber] = useState('');
  const [mismatchSuccessMsg, setMismatchSuccessMsg] = useState('');

  const activeAlerts = alerts.filter(a => !a.resolved && a.message.includes('TRUCK'));
  const currentDelivery = deliveries.find(d => d.id === selectedDeliveryId);
  const currentDriver = currentDelivery ? drivers.find(dr => dr.id === currentDelivery.driverId) : null;
  const currentTruck = currentDelivery ? trucks.find(t => t.id === currentDelivery.truckId) : null;
  
  const dispatchedDeliveries = deliveries.filter(d => !d.checkedIn && d.status === 'assigned');
  const onsiteDeliveries = deliveries.filter(d => d.checkedIn && !d.checkedOut);

  const handleScanSelect = (deliveryId) => {
    setSelectedDeliveryId(deliveryId);
    setOcrVerified(false);
    setPhotoVerified(false);
    setSealVerified(false);
    setHasCapturedPhotos(false);
  };

  const handleCheckoutSelect = (deliveryId) => {
    setCheckoutDeliveryId(deliveryId);
    setExitOcrVerified(false);
    setExitPhotoVerified(false);
    setExitSealVerified(false);
    setHasCapturedExitPhotos(false);
  };

  const simulateOCRScan = () => {
    if (!currentTruck) return;
    setOcrVerified(true);
  };

  const simulatePhotoCapture = () => {
    setHasCapturedPhotos(true);
    setPhotoVerified(true);
  };

  const simulateSealVerify = () => {
    setSealVerified(true);
  };

  const handleCheckInSubmit = () => {
    if (!ocrVerified || !photoVerified || !sealVerified) return;
    checkInTruck(
      selectedDeliveryId,
      ocrVerified,
      photoVerified,
      sealVerified,
      'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=100&h=100&fit=crop', // mock guard photo
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop', // mock container photo
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop'  // mock live seal photo
    );
    setSelectedDeliveryId('');
  };

  const handleCheckOutSubmit = (deliveryId) => {
    if (!exitOcrVerified || !exitPhotoVerified || !exitSealVerified) return;
    checkOutTruck(deliveryId);
    setCheckoutDeliveryId('');
    setExitOcrVerified(false);
    setExitPhotoVerified(false);
    setExitSealVerified(false);
    setHasCapturedExitPhotos(false);
  };

  return (
    <div className="mobile-app-wrapper guard-wrapper">
      {/* Mobile Header */}
      <div className="mobile-header guard-header" style={{ backgroundColor: 'var(--ceva-blue)' }}>
        <div className="mobile-status-bar">
          <span>9:41 AM</span>
          <div className="status-icons">📶 🔋</div>
        </div>
        <div className="mobile-title">
          <span>Guard Cargo Inspection</span>
        </div>
      </div>

      <div className="mobile-content">
        {/* Headcount Card */}
        <div className="guard-headcount-card">
          <div className="headcount-label">ACTIVE FREIGHT TRUCKS ON-SITE</div>
          <div className="headcount-num">{activeTruckHeadcount}</div>
          <div className="headcount-sub">Total trucks logged in at container bays</div>
        </div>

        {/* Alerts Alarm */}
        {activeAlerts.length > 0 && (
          <div className="guard-alarm-alert pulse-danger">
            ⚠️ TMS OVERSTAY WARNING: {activeAlerts.length} Truck(s) Alert
          </div>
        )}

        {/* Outbound/Inbound Scan Selector */}
        <div className="scanner-simulator-box">
          <h4>📷 Gate License Plate OCR Scanner</h4>
          <p className="scanner-desc">Scan incoming truck license plates to fetch dispatch documents.</p>
          <select 
            value={selectedDeliveryId} 
            onChange={(e) => handleScanSelect(e.target.value)}
            className="mobile-select"
          >
            <option value="">-- Click to Scan OCR Plate --</option>
            {dispatchedDeliveries.map(d => {
              const driver = drivers.find(dr => dr.id === d.driverId);
              const truck = trucks.find(t => t.id === d.truckId);
              const company = companies.find(c => c.id === d.companyId);
              return (
                <option key={d.id} value={d.id}>
                  Scan: {truck?.plate} ({d.type.toUpperCase()})
                </option>
              );
            })}
          </select>
        </div>

        {/* Selected Inspection Workflow */}
        {currentDelivery && (
          <div className="scan-result-card slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="scan-status-badge entry" style={{ alignSelf: 'center' }}>
              INSPECTION PROTOCOL ACTIVE: #{currentDelivery.id.slice(-5)}
            </div>
            <div className="scan-details" style={{ backgroundColor: '#ffffff' }}>
              <strong>1. Plate & Destination Check</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', fontSize: '0.78rem' }}>
                <span>Scheduled Plate: <strong>{currentTruck?.plate}</strong></span>
                <span>Destination Facility: <strong>{currentDelivery.destinationFacility || 'CEVA Hub - Dock A'}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  className={ocrVerified ? "inspector-btn-success" : "inspector-btn-primary"}
                  onClick={simulateOCRScan}
                  disabled={ocrVerified}
                >
                  {ocrVerified ? '🟢 OCR Match OK' : 'Trigger OCR Scan'}
                </button>
              </div>
            </div>

            {/* Step 2: Evidence Photos checklist */}
            <div className="scan-details" style={{ backgroundColor: '#ffffff' }}>
              <strong>2. Photographic Evidence Comparison</strong>
              <div className="inspection-photo-grid">
                <div className={`photo-placeholder-box ${hasCapturedPhotos ? 'success' : ''}`}>
                  {hasCapturedPhotos ? (
                    <img src={currentDelivery.containerPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} className="photo-thumb-mini" alt="" />
                  ) : (
                    <span>🚛 Dispatched Container</span>
                  )}
                </div>
                <div className={`photo-placeholder-box ${hasCapturedPhotos ? 'success' : ''}`}>
                  {hasCapturedPhotos ? (
                    <img src={currentDriver?.photo} className="photo-thumb-mini" alt="" />
                  ) : (
                    <span>👤 Driver Profile</span>
                  )}
                </div>
                <div className={`photo-placeholder-box ${hasCapturedPhotos ? 'success' : ''}`}>
                  {hasCapturedPhotos ? (
                    <img src={currentDelivery.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} className="photo-thumb-mini" alt="" />
                  ) : (
                    <span>📦 Baseline Seal</span>
                  )}
                </div>
              </div>
              <button 
                className="mobile-btn" 
                style={{ marginTop: '8px', fontSize: '0.75rem' }} 
                onClick={simulatePhotoCapture}
                disabled={hasCapturedPhotos}
              >
                📸 Fetch & Compare Dispatch Images
              </button>
            </div>

            {/* Step 3: On-the-spot Photo Verification */}
            {hasCapturedPhotos && (
              <div className="scan-details" style={{ backgroundColor: '#ffffff' }}>
                <strong>3. Biometric Driver ID Verification</strong>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <div style={{ textAlign: 'center', flex: '1' }}>
                    <img src={currentDriver?.photo} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    <div style={{ fontSize: '0.55rem' }}>Dispatched Profile</div>
                  </div>
                  <span style={{ fontSize: '1rem' }}>➡️</span>
                  <div style={{ textAlign: 'center', flex: '1' }}>
                    <img src={currentDriver?.photo} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', filter: 'hue-rotate(30deg)' }} alt="" />
                    <div style={{ fontSize: '0.55rem' }}>Gate Live Capture</div>
                  </div>
                  <div style={{ flex: '2', fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 'bold' }}>
                    ✅ Driver Match: 98% Correct (Biometric Verified)
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Seal Tamper Comparison verification */}
            {hasCapturedPhotos && (
              <div className="scan-details" style={{ backgroundColor: '#ffffff' }}>
                <strong>4. Container Seal Tamper Check</strong>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Compare baseline seal image from Sender with guard's gate seal photo.</p>
                <div className="seal-match-verification-card">
                  <div className="seal-images-comparison">
                    <div className="comparison-box">
                      <img src={currentDelivery.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} alt="" />
                      <span>Sender Dispatch</span>
                    </div>
                    <div className="comparison-box">
                      <img src={currentDelivery.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} style={{ filter: 'contrast(1.1) brightness(0.95)' }} alt="" />
                      <span>Gate Inspection Live</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem' }}>Seal #: {currentDelivery.sealNumber}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className={sealVerified ? "inspector-btn-success" : "inspector-btn-primary"}
                        onClick={simulateSealVerify}
                        disabled={sealVerified}
                      >
                        {sealVerified ? '✅ Seal Matched' : 'Physically Verify Seal'}
                      </button>
                      {!sealVerified && (
                        <button
                          type="button"
                          className="inspector-btn-primary"
                          style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                          onClick={() => {
                            setMismatchDeliveryId(currentDelivery.id);
                            setObservedSealNumber('');
                            setMismatchSuccessMsg('');
                            setShowMismatchDialog(true);
                          }}
                        >
                          ⚠️ Mismatch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Check-In Action Button */}
            <button 
              className="mobile-btn btn-success" 
              onClick={handleCheckInSubmit}
              disabled={!ocrVerified || !photoVerified || !sealVerified}
            >
              🟢 Complete Gate Check-In
            </button>
          </div>
        )}

        {/* Onsite checked in trucks */}
        <div className="guard-onsite-list">
          <h4>Checked-In Freight Trucks ({onsiteDeliveries.length})</h4>
          {onsiteDeliveries.length === 0 ? (
            <p className="empty-text">No freight trucks registered inside bays.</p>
          ) : (
            <div className="onsite-cards-container">
              {onsiteDeliveries.map(d => {
                const driver = drivers.find(dr => dr.id === d.driverId);
                const truck = trucks.find(t => t.id === d.truckId);
                const company = companies.find(c => c.id === d.companyId);
                const hasAlert = alerts.some(a => a.passId === d.id && !a.resolved);
                const isSelectedCheckout = checkoutDeliveryId === d.id;

                return (
                  <div key={d.id} className={`onsite-card ${hasAlert ? 'alert-border' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={driver?.photo} alt="" className="onsite-avatar" />
                      <div className="onsite-details">
                        <strong>Truck Plate: {truck?.plate} ({d.type.toUpperCase()})</strong>
                        <span className="vendor-lbl">{company?.name}</span>
                        <span className="zone-lbl">Driver: {driver?.name} | Cargo: {d.items}</span>
                      </div>
                      <div className="onsite-actions">
                        <button 
                          className={`btn-simulate-alert ${hasAlert ? 'triggered' : ''}`}
                          onClick={() => triggerTruckOverstay(d.id)}
                          disabled={hasAlert}
                        >
                          {hasAlert ? '⚠️ Overstay' : 'Simulate Overstay'}
                        </button>
                      </div>
                    </div>
                    {/* Checkout verification section */}
                    {isSelectedCheckout ? (
                      <div className="scan-result-card slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                        <div className="scan-status-badge outbound" style={{ alignSelf: 'center' }}>
                          OUTBOUND INSPECTION ACTIVE: #{d.id.slice(-5)}
                        </div>

                        {/* Step 1: Plate OCR Check */}
                        <div className="scan-details">
                          <strong>1. Exit Plate Check</strong>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem' }}>
                            <span>Plate: <strong>{truck?.plate}</strong></span>
                            <button 
                              type="button"
                              className={exitOcrVerified ? "inspector-btn-success" : "inspector-btn-primary"}
                              onClick={() => setExitOcrVerified(true)}
                              disabled={exitOcrVerified}
                            >
                              {exitOcrVerified ? '🟢 Exit OCR OK' : 'Trigger OCR Scan'}
                            </button>
                          </div>
                        </div>

                        {/* Step 2: Outbound Evidence Photos */}
                        <div className="scan-details">
                          <strong>2. Outbound Photos</strong>
                          <div className="inspection-photo-grid">
                            <div className={`photo-placeholder-box ${hasCapturedExitPhotos ? 'success' : ''}`}>
                              {hasCapturedExitPhotos ? (
                                <img src={d.containerPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} className="photo-thumb-mini" alt="" />
                              ) : (
                                <span>🚛 Exit Container</span>
                              )}
                            </div>
                            <div className={`photo-placeholder-box ${hasCapturedExitPhotos ? 'success' : ''}`}>
                              {hasCapturedExitPhotos ? (
                                <img src={driver?.photo} className="photo-thumb-mini" alt="" />
                              ) : (
                                <span>👤 Driver Profile</span>
                              )}
                            </div>
                            <div className={`photo-placeholder-box ${hasCapturedExitPhotos ? 'success' : ''}`}>
                              {hasCapturedExitPhotos ? (
                                <img src={d.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} className="photo-thumb-mini" alt="" />
                              ) : (
                                <span>📦 Exit Seal</span>
                              )}
                            </div>
                          </div>
                          <button 
                            type="button"
                            className="mobile-btn" 
                            style={{ marginTop: '8px', fontSize: '0.75rem' }} 
                            onClick={() => {
                              setHasCapturedExitPhotos(true);
                              setExitPhotoVerified(true);
                            }}
                            disabled={hasCapturedExitPhotos}
                          >
                            📸 Capture Outbound Images
                          </button>
                        </div>

                        {/* Step 3: Biometric Driver ID Verification */}
                        {hasCapturedExitPhotos && (
                          <div className="scan-details">
                            <strong>3. Biometric Driver ID Verification</strong>
                            <div className="biometric-verif-row">
                              <div className="biometric-avatar-wrap">
                                <img src={driver?.photo} alt="" />
                                <span>Baseline</span>
                              </div>
                              <span style={{ fontSize: '1rem' }}>➡️</span>
                              <div className="biometric-avatar-wrap">
                                <img src={driver?.photo} style={{ filter: 'hue-rotate(60deg)' }} alt="" />
                                <span>Exit Captured</span>
                              </div>
                              <div className="biometric-result">
                                ✅ Driver Match: 98% Correct (Biometric Verified)
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 4: Seal Tamper Comparison verification */}
                        {hasCapturedExitPhotos && (
                          <div className="scan-details">
                            <strong>4. Outbound Seal Tamper Check</strong>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Compare baseline seal image from entry with exit seal photo.</p>
                            <div className="seal-match-verification-card">
                              <div className="seal-images-comparison">
                                <div className="comparison-box">
                                  <img src={d.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} alt="" />
                                  <span>Entry Baseline</span>
                                </div>
                                <div className="comparison-box">
                                  <img src={d.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} style={{ filter: 'contrast(1.1) brightness(0.95)' }} alt="" />
                                  <span>Exit Live</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <span style={{ fontSize: '0.7rem' }}>Seal #: {d.sealNumber}</span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button 
                                    type="button"
                                    className={exitSealVerified ? "inspector-btn-success" : "inspector-btn-primary"}
                                    onClick={() => setExitSealVerified(true)}
                                    disabled={exitSealVerified}
                                  >
                                    {exitSealVerified ? '✅ Seal Matched' : 'Verify Outbound Seal'}
                                  </button>
                                  {!exitSealVerified && (
                                    <button
                                      type="button"
                                      className="inspector-btn-primary"
                                      style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                                      onClick={() => {
                                        setMismatchDeliveryId(d.id);
                                        setObservedSealNumber('');
                                        setMismatchSuccessMsg('');
                                        setShowMismatchDialog(true);
                                      }}
                                    >
                                      ⚠️ Mismatch
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <button 
                            type="button"
                            className="mobile-btn btn-danger" 
                            style={{ margin: 0, padding: '10px', fontSize: '0.82rem', flex: 1 }}
                            onClick={() => handleCheckOutSubmit(d.id)}
                            disabled={!exitOcrVerified || !exitPhotoVerified || !exitSealVerified}
                          >
                            🔴 Complete Outbound Exit
                          </button>
                          <button 
                            type="button"
                            className="mobile-btn btn-close" 
                            style={{ margin: 0, padding: '10px', fontSize: '0.82rem', flex: 1 }}
                            onClick={() => setCheckoutDeliveryId('')}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        className="mobile-btn btn-danger" 
                        style={{ padding: '10px', fontSize: '0.82rem', marginTop: '4px' }}
                        onClick={() => handleCheckoutSelect(d.id)}
                      >
                        Log Depart/Exit Gate
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {showMismatchDialog && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            fontFamily: "'Inter', sans-serif"
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '280px',
              padding: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              animation: 'slideUp 0.15s ease-out'
            }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
                Report Seal Mismatch
              </h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
                Enter the actual physical seal number observed on the container.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Observed Seal #
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. SEAL 1234"
                  value={observedSealNumber} 
                  onChange={(e) => setObservedSealNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>
              
              {mismatchSuccessMsg && (
                <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, textAlign: 'center' }}>
                  {mismatchSuccessMsg}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMismatchDialog(false);
                    setObservedSealNumber('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!observedSealNumber.trim()) {
                      alert("Please enter the observed seal number.");
                      return;
                    }
                    triggerSealMismatch(mismatchDeliveryId, observedSealNumber.trim());
                    setMismatchSuccessMsg("Reported successfully!");
                    setTimeout(() => {
                      setShowMismatchDialog(false);
                      setObservedSealNumber('');
                      setMismatchSuccessMsg('');
                    }, 1200);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
