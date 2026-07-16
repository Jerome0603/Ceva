import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const SystemContext = createContext();
const API_URL = 'http://localhost:8000/api/v1';

/* ── Data mappers (Supabase snake_case → frontend camelCase) ── */
const mapCompany  = r => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, type: r.type, parentCompanyId: r.parent_company_id, status: r.status, taxId: r.tax_id, dotNumber: r.dot_number, insurancePolicy: r.insurance_policy, insuranceAmount: r.insurance_amount, dunsNumber: r.duns_number, physicalAddress: r.physical_address, bizRegType: r.biz_reg_type, gpsEquipped: r.gps_equipped, customsLicense: r.customs_license, iso9001: r.iso_9001, iso28000: r.iso_28000, tapaTsr: r.tapa_tsr, ctpat: r.ctpat, gdpPharma: r.gdp_pharma, publicLiabilityLimit: r.public_liability_limit, createdAt: r.created_at?.slice(0,10) });
const mapWorker   = r => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, companyId: r.company_id, supervisorName: r.supervisor_name, photo: r.photo_url, status: r.status });
const mapPass     = r => ({ id: r.id, workerId: r.worker_id, companyId: r.company_id, supervisorName: r.supervisor_name, zoneLevel: r.zone_level, startDate: r.start_date, endDate: r.end_date, startTime: r.start_time, endTime: r.end_time, purpose: r.purpose, status: r.status, checkedIn: r.checked_in, checkedOut: r.checked_out, qr_secure_signature: r.hmac_signature });
const mapTruck    = r => ({ id: r.id, plate: r.plate, vin: r.vin, model: r.model, companyId: r.company_id, status: r.status });
const mapDriver   = r => ({ id: r.id, name: r.name, license: r.license, photo: r.photo_url, companyId: r.company_id, status: r.status });
const mapDelivery = r => ({ id: r.id, truckId: r.truck_id, driverId: r.driver_id, companyId: r.company_id, type: r.type, sealNumber: r.seal_number, baselineSealPhoto: r.baseline_seal_photo, containerPhoto: r.container_photo, destinationFacility: r.destination_facility, items: r.items, status: r.status, checkedIn: r.checked_in, checkedOut: r.checked_out });
const mapLog      = r => ({ id: r.id, passId: r.pass_id, workerName: r.worker_name, companyName: r.company_name, action: r.action, type: r.type, timestamp: new Date(r.created_at).toLocaleTimeString() });
const mapAlert    = r => ({ id: r.id, type: r.type, message: r.message, passId: r.pass_id, resolved: r.resolved, timestamp: new Date(r.created_at).toLocaleTimeString() });
const mapSupervisor = r => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, companyId: r.company_id, photo: r.photo_url, status: r.status });

export const SystemProvider = ({ children }) => {
  const [companies,  setCompanies]  = useState([]);
  const [workers,    setWorkers]    = useState([]);
  const [passes,     setPasses]     = useState([]);
  const [trucks,     setTrucks]     = useState([]);
  const [drivers,    setDrivers]    = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [logs,       setLogs]       = useState([]);
  const [alerts,     setAlerts]     = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [dbLoading,  setDbLoading]  = useState(true);

  /* ── Load functions ─────────────────────────────────────── */
  const loadCompanies  = useCallback(async () => { const { data } = await supabase.from('companies').select('*').order('created_at',{ascending:false}); if(data) setCompanies(data.map(mapCompany)); }, []);
  const loadWorkers    = useCallback(async () => { const { data } = await supabase.from('workers').select('*').order('created_at',{ascending:false}); if(data) setWorkers(data.map(mapWorker)); }, []);
  const loadPasses     = useCallback(async () => { const { data } = await supabase.from('gate_passes').select('*').order('created_at',{ascending:false}); if(data) setPasses(data.map(mapPass)); }, []);
  const loadTrucks     = useCallback(async () => { const { data } = await supabase.from('trucks').select('*').order('created_at',{ascending:false}); if(data) setTrucks(data.map(mapTruck)); }, []);
  const loadDrivers    = useCallback(async () => { const { data } = await supabase.from('drivers').select('*').order('created_at',{ascending:false}); if(data) setDrivers(data.map(mapDriver)); }, []);
  const loadDeliveries = useCallback(async () => { const { data } = await supabase.from('deliveries').select('*').order('created_at',{ascending:false}); if(data) setDeliveries(data.map(mapDelivery)); }, []);
  const loadLogs       = useCallback(async () => { const { data } = await supabase.from('gate_logs').select('*').order('created_at',{ascending:false}).limit(50); if(data) setLogs(data.map(mapLog)); }, []);
  const loadAlerts     = useCallback(async () => { const { data } = await supabase.from('security_alerts').select('*').order('created_at',{ascending:false}); if(data) setAlerts(data.map(mapAlert)); }, []);
  const loadSupervisors = useCallback(async () => { const { data } = await supabase.from('supervisors').select('*').order('created_at',{ascending:false}); if(data) setSupervisors(data.map(mapSupervisor)); }, []);

  const loadAll = useCallback(async () => {
    setDbLoading(true);
    await Promise.all([loadCompanies(), loadWorkers(), loadPasses(), loadTrucks(), loadDrivers(), loadDeliveries(), loadLogs(), loadAlerts(), loadSupervisors()]);
    setDbLoading(false);
  }, [loadCompanies, loadWorkers, loadPasses, loadTrucks, loadDrivers, loadDeliveries, loadLogs, loadAlerts, loadSupervisors]);

  /* ── Initial load + realtime subscription ─────────────── */
  useEffect(() => {
    loadAll();

    const channel = supabase.channel('system-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' },       () => loadCompanies())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' },         () => loadWorkers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gate_passes' },     () => loadPasses())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trucks' },          () => loadTrucks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' },         () => loadDrivers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' },      () => loadDeliveries())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gate_logs' },       () => loadLogs())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'security_alerts' }, () => loadAlerts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supervisors' },     () => loadSupervisors())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [loadAll]);

  // Auto-detect overstays reactively when data updates
  useEffect(() => {
    if (dbLoading) return;

    const now = new Date();
    const currentDateStr = now.toISOString().slice(0, 10);
    const currentTimeStr = now.toTimeString().slice(0, 5);

    // 1. Worker Overstays
    passes.forEach(async (p) => {
      if (p.checkedIn && !p.checkedOut && p.status === 'approved') {
        const hasOverstayed = p.endDate < currentDateStr || (p.endDate === currentDateStr && p.endTime < currentTimeStr);
        if (hasOverstayed) {
          const alertExists = alerts.some(a => a.passId === p.id && a.type === 'overstay' && !a.resolved);
          if (!alertExists) {
            console.log(`Auto-detect: Worker ${p.id} has overstayed.`);
            const worker = workers.find(w => w.id === p.workerId);
            const company = companies.find(c => c.id === p.companyId);
            await supabase.from('security_alerts').insert({
              type: 'overstay',
              message: `WORKER OVERSTAY: Worker ${worker?.name || 'Unknown'} (Company: ${company?.name || 'N/A'}) exceeded zone access time limit!`,
              pass_id: p.id,
              resolved: false,
            });
            await loadAlerts();
          }
        }
      }
    });

    // 2. Truck Overstays
    deliveries.forEach(async (d) => {
      if (d.status === 'checked_in') {
        const checkInTime = new Date(d.updatedAt || d.createdAt);
        const minutesElapsed = (now - checkInTime) / 1000 / 60;
        if (minutesElapsed > 5) {
          const alertExists = alerts.some(a => a.passId === d.id && a.type === 'overstay' && !a.resolved);
          if (!alertExists) {
            console.log(`Auto-detect: Truck delivery ${d.id} has overstayed.`);
            const driver  = drivers.find(drv => drv.id === d.driverId);
            const truck   = trucks.find(t => t.id === d.truckId);
            const company = companies.find(c => c.id === d.companyId);
            await supabase.from('security_alerts').insert({
              type: 'overstay',
              message: `TRUCK OVERSTAY: Driver ${driver?.name || 'Unknown'} (Truck: ${truck?.plate || 'N/A'}) exceeded dock time limit!`,
              pass_id: d.id,
              resolved: false,
            });
            await loadAlerts();
          }
        }
      }
    });
  }, [passes, deliveries, alerts, dbLoading, workers, companies, drivers, trucks, loadAlerts]);

  /* ── Derived stats ──────────────────────────────────────── */
  const activeHeadcount     = passes.filter(p => p.checkedIn && !p.checkedOut).length;
  const activeTruckHeadcount = deliveries.filter(d => d.checkedIn && !d.checkedOut).length;

  /* ── VMS Actions ────────────────────────────────────────── */
  const registerCompany = async (name, email, phone, type = 'vendor', parentCompanyId = '', extra = {}) => {
    const payload = {
      name, email, phone, type,
      parent_company_id: parentCompanyId || null,
      status: type === 'trucking' ? (parentCompanyId ? 'pending_vendor' : 'pending_ceva') : 'pending',
      tax_id: extra.taxId || null,
      dot_number: extra.dotNumber || null,
      insurance_policy: extra.insurancePolicy || null,
      insurance_amount: extra.insuranceAmount || null,
      duns_number: extra.dunsNumber || null,
      physical_address: extra.physicalAddress || null,
      biz_reg_type: extra.bizRegType || null,
      gps_equipped: extra.gpsEquipped || null,
      customs_license: extra.customsLicense || null,
      iso_9001: !!extra.iso9001,
      iso_28000: !!extra.iso28000,
      tapa_tsr: !!extra.tapaTsr,
      ctpat: !!extra.ctpat,
      gdp_pharma: !!extra.gdpPharma,
      public_liability_limit: extra.publicLiabilityLimit || null,
    };
    const { data, error } = await supabase.from('companies').insert(payload).select().single();
    if (error) { console.error('registerCompany:', error.message); return null; }
    await loadCompanies();

    // Also notify backend
    try {
      await fetch(`${API_URL}/companies/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, type, parent_company_id: parentCompanyId }),
      });
    } catch { /* offline */ }

    return data ? mapCompany(data) : null;
  };

  const verifyCompany = async (companyId, approve) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    let newStatus = approve ? 'approved' : 'rejected';
    if (approve && company.status === 'pending_vendor') newStatus = 'pending_ceva';

    const { error } = await supabase.from('companies').update({ status: newStatus }).eq('id', companyId);
    if (error) console.error('verifyCompany:', error.message);
    await loadCompanies();
  };

  const registerWorker = async (name, companyId, supervisorName, email = '', phone = '', photoUrl = '') => {
    const { data, error } = await supabase.from('workers').insert({
      name, email: email || `${name.toLowerCase().replace(/\s+/g,'_')}@vendor.com`,
      phone: phone || '+1 555-0000', company_id: companyId,
      supervisor_name: supervisorName, status: 'pending',
      photo_url: photoUrl
    }).select().single();
    if (error) { console.error('registerWorker:', error.message); return null; }
    await loadWorkers();
    return data ? mapWorker(data) : null;
  };

  const verifyWorker = async (workerId, approve, supervisorName) => {
    const updateData = { status: approve ? 'approved' : 'rejected' };
    if (approve && supervisorName) {
      updateData.supervisor_name = supervisorName;
    }
    const { error } = await supabase.from('workers').update(updateData).eq('id', workerId);
    if (error) console.error('verifyWorker:', error.message);
    await loadWorkers();
  };

  const requestPass = async (workerId, zone, startDate, endDate, startTime, endTime, purpose, supervisorName = '') => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return null;
    const { data, error } = await supabase.from('gate_passes').insert({
      worker_id: workerId, company_id: worker.companyId,
      supervisor_name: supervisorName, zone_level: zone,
      start_date: startDate, end_date: endDate,
      start_time: startTime, end_time: endTime,
      purpose, status: 'pending_vendor',
    }).select().single();
    if (error) { console.error('requestPass:', error.message); return null; }
    await loadPasses();
    return data ? mapPass(data) : null;
  };

  const approvePassVendor = async (passId, approve) => {
    const newStatus = approve ? 'pending_ceva' : 'rejected';
    const { error } = await supabase.from('gate_passes').update({ status: newStatus }).eq('id', passId);
    if (error) console.error('approvePassVendor:', error.message);
    await loadPasses();
  };

  const approvePassCeva = async (passId, approve) => {
    if (approve) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${API_URL}/passes/${passId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
        });
        if (res.ok) {
          // Backend handled approval + HMAC write to Supabase — just reload
          await loadPasses();
          return;
        }
        // Backend returned an error (e.g. not configured) — fall through to fallback
        console.warn('approvePassCeva: backend returned', res.status, '— using fallback');
      } catch (err) {
        console.warn('approvePassCeva: backend unreachable —', err.message, '— using fallback');
      }
      // Offline fallback: approve directly via Supabase with a marker signature
      await supabase.from('gate_passes').update({
        status: 'approved',
        hmac_signature: `offline-${passId.slice(0, 8)}-${Date.now()}`,
      }).eq('id', passId);
    } else {
      await supabase.from('gate_passes').update({ status: 'rejected' }).eq('id', passId);
    }
    await loadPasses();
  };

  const approvePassVendorBulk = async (passIds, approve) => {
    const newStatus = approve ? 'pending_ceva' : 'rejected';
    const { error } = await supabase.from('gate_passes').update({ status: newStatus }).in('id', passIds);
    if (error) console.error('approvePassVendorBulk:', error.message);
    await loadPasses();
  };

  const approvePassCevaBulk = async (passIds, approve) => {
    // Run all approvals in parallel to ensure HMAC signing is completed for each pass
    await Promise.all(passIds.map(passId => approvePassCeva(passId, approve)));
  };


  const checkInPass = async (passId) => {
    const pass = passes.find(p => p.id === passId);
    if (!pass) return false;
    const { error } = await supabase.from('gate_passes').update({ checked_in: true }).eq('id', passId);
    if (error) { console.error('checkInPass:', error.message); return false; }

    const worker  = workers.find(w => w.id === pass.workerId);
    const company = companies.find(c => c.id === pass.companyId);
    await supabase.from('gate_logs').insert({ pass_id: passId, worker_name: worker?.name || 'Unknown', company_name: company?.name || 'Unknown', action: 'check_in', type: 'visitor' });
    await Promise.all([loadPasses(), loadLogs()]);
    return true;
  };

  const checkOutPass = async (passId) => {
    const pass = passes.find(p => p.id === passId);
    if (!pass) return false;
    const { error } = await supabase.from('gate_passes').update({ checked_out: true }).eq('id', passId);
    if (error) { console.error('checkOutPass:', error.message); return false; }

    const worker  = workers.find(w => w.id === pass.workerId);
    const company = companies.find(c => c.id === pass.companyId);
    await supabase.from('gate_logs').insert({ pass_id: passId, worker_name: worker?.name || 'Unknown', company_name: company?.name || 'Unknown', action: 'check_out', type: 'visitor' });
    await Promise.all([loadPasses(), loadLogs()]);
    return true;
  };

  /* ── TMS Actions ────────────────────────────────────────── */
  const registerTruck = async (plate, vin, model, companyId) => {
    const { data, error } = await supabase.from('trucks').insert({ plate, vin, model, company_id: companyId, status: 'pending' }).select().single();
    if (error) { console.error('registerTruck:', error.message); return null; }
    await loadTrucks();
    return data ? mapTruck(data) : null;
  };

  const verifyTruck = async (truckId, approve) => {
    const { error } = await supabase.from('trucks').update({ status: approve ? 'approved' : 'rejected' }).eq('id', truckId);
    if (error) console.error('verifyTruck:', error.message);
    await loadTrucks();
  };

  const registerDriver = async (name, license, companyId) => {
    const { data, error } = await supabase.from('drivers').insert({ name, license, company_id: companyId, status: 'pending' }).select().single();
    if (error) { console.error('registerDriver:', error.message); return null; }
    await loadDrivers();
    return data ? mapDriver(data) : null;
  };

  const verifyDriver = async (driverId, approve) => {
    const { error } = await supabase.from('drivers').update({ status: approve ? 'approved' : 'rejected' }).eq('id', driverId);
    if (error) console.error('verifyDriver:', error.message);
    await loadDrivers();
  };

  const assignDelivery = async (truckId, driverId, companyId, type, sealNumber, baselinePhoto = '', items = '', containerPhoto = '', destinationFacility = 'CEVA Hub - Dock A') => {
    const { data, error } = await supabase.from('deliveries').insert({
      truck_id: truckId, driver_id: driverId, company_id: companyId,
      type, seal_number: sealNumber, baseline_seal_photo: baselinePhoto,
      container_photo: containerPhoto, destination_facility: destinationFacility,
      items, status: 'assigned',
    }).select().single();
    if (error) { console.error('assignDelivery:', error.message); return null; }
    await loadDeliveries();
    return data ? mapDelivery(data) : null;
  };

  const checkInTruck = async (deliveryId) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return false;
    await supabase.from('deliveries').update({ checked_in: true, status: 'checked_in' }).eq('id', deliveryId);
    const driver  = drivers.find(d => d.id === delivery.driverId);
    const truck   = trucks.find(t => t.id === delivery.truckId);
    const company = companies.find(c => c.id === delivery.companyId);
    await supabase.from('gate_logs').insert({ pass_id: deliveryId, worker_name: `${driver?.name || 'Driver'} [${truck?.plate || 'OCR'}]`, company_name: company?.name || 'Trucking Co', action: 'check_in', type: 'truck' });
    await Promise.all([loadDeliveries(), loadLogs()]);
    return true;
  };

  const checkOutTruck = async (deliveryId) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return false;
    await supabase.from('deliveries').update({ checked_out: true, status: 'checked_out' }).eq('id', deliveryId);
    const driver  = drivers.find(d => d.id === delivery.driverId);
    const truck   = trucks.find(t => t.id === delivery.truckId);
    const company = companies.find(c => c.id === delivery.companyId);
    await supabase.from('gate_logs').insert({ pass_id: deliveryId, worker_name: `${driver?.name || 'Driver'} [${truck?.plate || 'OCR'}]`, company_name: company?.name || 'Trucking Co', action: 'check_out', type: 'truck' });
    await Promise.all([loadDeliveries(), loadLogs()]);
    return true;
  };

  const triggerTruckOverstay = async (deliveryId) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    const driver  = drivers.find(d => d.id === delivery.driverId);
    const truck   = trucks.find(t => t.id === delivery.truckId);
    const company = companies.find(c => c.id === delivery.companyId);
    await supabase.from('security_alerts').insert({
      type: 'overstay',
      message: `TRUCK OVERSTAY: Driver ${driver?.name || 'Unknown'} (Truck: ${truck?.plate || 'N/A'}) exceeded dock time limit!`,
      pass_id: deliveryId, resolved: false,
    });
    await loadAlerts();
  };

  const triggerOverstay = async (passId) => {
    const pass = passes.find(p => p.id === passId);
    if (!pass) return;
    const worker = workers.find(w => w.id === pass.workerId);
    const company = companies.find(c => c.id === pass.companyId);
    await supabase.from('security_alerts').insert({
      type: 'overstay',
      message: `WORKER OVERSTAY: Worker ${worker?.name || 'Unknown'} (Company: ${company?.name || 'N/A'}) exceeded zone access time limit!`,
      pass_id: passId,
      resolved: false,
    });
    await loadAlerts();
  };

  const triggerSealMismatch = async (deliveryId, actualSeal = '') => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    const driver = drivers.find(d => d.id === delivery.driverId);
    const truck = trucks.find(t => t.id === delivery.truckId);
    const company = companies.find(c => c.id === delivery.companyId);
    await supabase.from('security_alerts').insert({
      type: 'seal_mismatch',
      message: `SEAL MISMATCH: Driver ${driver?.name || 'Unknown'} (Truck: ${truck?.plate || 'N/A'}, Company: ${company?.name || 'N/A'}) reported a seal mismatch! Expected: ${delivery.sealNumber}${actualSeal ? `, Found: ${actualSeal}` : ''}`,
      pass_id: deliveryId,
      resolved: false
    });
    await loadAlerts();
  };

  const resolveAlert = async (alertId) => {
    await supabase.from('security_alerts').update({ resolved: true }).eq('id', alertId);
    await loadAlerts();
  };

  const registerSupervisor = async (name, email, phone, companyId, photoUrl = '') => {
    const { data, error } = await supabase.from('supervisors').insert({
      name, email, phone: phone || null, company_id: companyId, status: 'approved', photo_url: photoUrl
    }).select().single();
    if (error) { console.error('registerSupervisor:', error.message); return null; }
    await loadSupervisors();
    return data ? mapSupervisor(data) : null;
  };

  const verifySupervisor = async (supervisorId, approve) => {
    const { error } = await supabase.from('supervisors').update({ status: approve ? 'approved' : 'rejected' }).eq('id', supervisorId);
    if (error) console.error('verifySupervisor:', error.message);
    await loadSupervisors();
  };

  const deleteWorker = async (workerId) => {
    const { error } = await supabase.from('workers').delete().eq('id', workerId);
    if (error) console.error('deleteWorker:', error.message);
    await loadWorkers();
  };

  const deleteSupervisor = async (supervisorId) => {
    const { error } = await supabase.from('supervisors').delete().eq('id', supervisorId);
    if (error) console.error('deleteSupervisor:', error.message);
    await loadSupervisors();
  };

  const resetSystem = async () => {
    // Clear all tables (development only)
    await Promise.all([
      supabase.from('security_alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('gate_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ]);
    await Promise.all([
      supabase.from('deliveries').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('gate_passes').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ]);
    await Promise.all([
      supabase.from('drivers').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('trucks').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('workers').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('supervisors').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ]);
    await loadAll();
  };

  return (
    <SystemContext.Provider value={{
      companies, workers, passes, trucks, drivers, deliveries, logs, alerts, supervisors,
      activeHeadcount, activeTruckHeadcount, dbLoading,
      registerCompany, verifyCompany,
      registerWorker, verifyWorker, deleteWorker,
      requestPass, approvePassVendor, approvePassCeva, approvePassVendorBulk, approvePassCevaBulk, checkInPass, checkOutPass,
      registerTruck, verifyTruck,
      registerDriver, verifyDriver,
      assignDelivery, checkInTruck, checkOutTruck, triggerTruckOverstay, triggerOverstay, triggerSealMismatch,
      resolveAlert, registerSupervisor, verifySupervisor, deleteSupervisor, resetSystem,
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);
