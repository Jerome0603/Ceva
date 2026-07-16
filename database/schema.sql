-- =============================================================
-- CEVA LOGISTICS — VISITOR & TRUCK MANAGEMENT SYSTEM
-- SUPABASE DATABASE SCHEMA
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE 1: companies
CREATE TABLE IF NOT EXISTS public.companies (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT        NOT NULL,
    email               TEXT        NOT NULL UNIQUE,
    phone               TEXT        NOT NULL,
    type                TEXT        NOT NULL CHECK (type IN ('vendor', 'trucking')),
    parent_company_id   UUID        REFERENCES public.companies(id) ON DELETE SET NULL,
    status              TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','pending_vendor','pending_ceva','approved','rejected')),
    tax_id              TEXT,
    dot_number          TEXT,
    insurance_policy    TEXT,
    insurance_amount    TEXT,
    duns_number         TEXT,
    physical_address    TEXT,
    biz_reg_type        TEXT,
    gps_equipped        TEXT,
    customs_license     TEXT,
    iso_9001            BOOLEAN     DEFAULT FALSE,
    iso_28000           BOOLEAN     DEFAULT FALSE,
    tapa_tsr            BOOLEAN     DEFAULT FALSE,
    ctpat               BOOLEAN     DEFAULT FALSE,
    gdp_pharma          BOOLEAN     DEFAULT FALSE,
    public_liability_limit TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE 2: profiles (links auth.users → role + company)
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT        NOT NULL CHECK (role IN ('ceva_admin','company_admin','cargo_admin')),
    company_id  UUID        REFERENCES public.companies(id) ON DELETE SET NULL,
    full_name   TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE 3: workers
CREATE TABLE IF NOT EXISTS public.workers (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,
    email           TEXT        NOT NULL,
    phone           TEXT,
    company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supervisor_name TEXT        NOT NULL,
    photo_url       TEXT,
    status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE 3.5: supervisors (company-based approved supervisors)
CREATE TABLE IF NOT EXISTS public.supervisors (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    email       TEXT        NOT NULL UNIQUE,
    phone       TEXT,
    company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status      TEXT        NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE 4: gate_passes
CREATE TABLE IF NOT EXISTS public.gate_passes (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id       UUID    NOT NULL REFERENCES public.workers(id)   ON DELETE CASCADE,
    company_id      UUID    NOT NULL REFERENCES public.companies(id)  ON DELETE CASCADE,
    supervisor_name TEXT    NOT NULL,
    zone_level      TEXT    NOT NULL,
    start_date      DATE    NOT NULL,
    end_date        DATE    NOT NULL,
    start_time      TIME    NOT NULL DEFAULT '08:00',
    end_time        TIME    NOT NULL DEFAULT '17:00',
    purpose         TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'pending_vendor'
                    CHECK (status IN ('pending_vendor','pending_ceva','approved','rejected')),
    checked_in      BOOLEAN NOT NULL DEFAULT FALSE,
    checked_out     BOOLEAN NOT NULL DEFAULT FALSE,
    hmac_signature  TEXT,
    approved_by     UUID    REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_pass_dates CHECK (end_date >= start_date)
);

-- TABLE 5: trucks
CREATE TABLE IF NOT EXISTS public.trucks (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    plate       TEXT    NOT NULL UNIQUE,
    vin         TEXT    NOT NULL UNIQUE,
    model       TEXT    NOT NULL,
    company_id  UUID    NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status      TEXT    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE 6: drivers
CREATE TABLE IF NOT EXISTS public.drivers (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT    NOT NULL,
    license     TEXT    NOT NULL UNIQUE,
    photo_url   TEXT,
    company_id  UUID    NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status      TEXT    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE 7: deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id            UUID    NOT NULL REFERENCES public.trucks(id)    ON DELETE CASCADE,
    driver_id           UUID    NOT NULL REFERENCES public.drivers(id)   ON DELETE CASCADE,
    company_id          UUID    NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type                TEXT    NOT NULL CHECK (type IN ('dropoff','pickup')),
    seal_number         TEXT    NOT NULL,
    baseline_seal_photo TEXT,
    items               TEXT,
    status              TEXT    NOT NULL DEFAULT 'assigned'
                        CHECK (status IN ('assigned','checked_in','checked_out')),
    checked_in          BOOLEAN NOT NULL DEFAULT FALSE,
    checked_out         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE 8: gate_logs (immutable audit trail)
CREATE TABLE IF NOT EXISTS public.gate_logs (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id       UUID,
    worker_name   TEXT    NOT NULL,
    company_name  TEXT    NOT NULL,
    action        TEXT    NOT NULL CHECK (action IN ('check_in','check_out')),
    type          TEXT    NOT NULL CHECK (type IN ('visitor','truck')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE 9: security_alerts
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    type        TEXT    NOT NULL,
    message     TEXT    NOT NULL,
    pass_id     UUID,
    resolved    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_companies_type       ON public.companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_status     ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_parent     ON public.companies(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role        ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_company     ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_workers_company      ON public.workers(company_id);
CREATE INDEX IF NOT EXISTS idx_workers_status       ON public.workers(status);
CREATE INDEX IF NOT EXISTS idx_passes_worker        ON public.gate_passes(worker_id);
CREATE INDEX IF NOT EXISTS idx_passes_company       ON public.gate_passes(company_id);
CREATE INDEX IF NOT EXISTS idx_passes_status        ON public.gate_passes(status);
CREATE INDEX IF NOT EXISTS idx_trucks_company       ON public.trucks(company_id);
CREATE INDEX IF NOT EXISTS idx_trucks_status        ON public.trucks(status);
CREATE INDEX IF NOT EXISTS idx_drivers_company      ON public.drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status       ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_truck     ON public.deliveries(truck_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver    ON public.deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_company   ON public.deliveries(company_id);
CREATE INDEX IF NOT EXISTS idx_gate_logs_created    ON public.gate_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved      ON public.security_alerts(resolved);

-- =============================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE TRIGGER trg_companies_updated  BEFORE UPDATE ON public.companies  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trg_workers_updated    BEFORE UPDATE ON public.workers    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trg_passes_updated     BEFORE UPDATE ON public.gate_passes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trg_trucks_updated     BEFORE UPDATE ON public.trucks     FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trg_drivers_updated    BEFORE UPDATE ON public.drivers    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trg_deliveries_updated BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================
-- TRIGGER: Auto-create profile on signup
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'company_admin'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE public.companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_passes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts  ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- RLS: profiles
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.get_my_role() = 'ceva_admin');
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- RLS: companies
CREATE POLICY "companies_public_insert"  ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "companies_ceva_all"       ON public.companies FOR ALL    USING (public.get_my_role() = 'ceva_admin');
CREATE POLICY "companies_vendor_select"  ON public.companies FOR SELECT USING (public.get_my_role() = 'company_admin' AND (id = public.get_my_company_id() OR parent_company_id = public.get_my_company_id()));
CREATE POLICY "companies_cargo_select"   ON public.companies FOR SELECT USING (public.get_my_role() = 'cargo_admin' AND type = 'trucking');
CREATE POLICY "companies_cargo_update"   ON public.companies FOR UPDATE USING (public.get_my_role() = 'cargo_admin' AND type = 'trucking');

-- RLS: workers
CREATE POLICY "workers_ceva_all"    ON public.workers FOR ALL USING (public.get_my_role() = 'ceva_admin');
CREATE POLICY "workers_vendor_all"  ON public.workers FOR ALL USING (public.get_my_role() = 'company_admin' AND company_id = public.get_my_company_id());

-- RLS: gate_passes
CREATE POLICY "passes_ceva_all"   ON public.gate_passes FOR ALL USING (public.get_my_role() = 'ceva_admin');
CREATE POLICY "passes_vendor_all" ON public.gate_passes FOR ALL USING (public.get_my_role() = 'company_admin' AND company_id = public.get_my_company_id());

-- RLS: trucks
CREATE POLICY "trucks_ceva_all"   ON public.trucks FOR ALL USING (public.get_my_role() = 'ceva_admin');
CREATE POLICY "trucks_cargo_all"  ON public.trucks FOR ALL USING (public.get_my_role() = 'cargo_admin');
CREATE POLICY "trucks_vendor_own" ON public.trucks FOR ALL USING (
    public.get_my_role() = 'company_admin' 
    AND (
        company_id = public.get_my_company_id() 
        OR company_id IN (SELECT id FROM public.companies WHERE parent_company_id = public.get_my_company_id())
    )
);

-- RLS: drivers
CREATE POLICY "drivers_ceva_all"   ON public.drivers FOR ALL USING (public.get_my_role() = 'ceva_admin');
CREATE POLICY "drivers_cargo_all"  ON public.drivers FOR ALL USING (public.get_my_role() = 'cargo_admin');
CREATE POLICY "drivers_vendor_own" ON public.drivers FOR ALL USING (
    public.get_my_role() = 'company_admin' 
    AND (
        company_id = public.get_my_company_id() 
        OR company_id IN (SELECT id FROM public.companies WHERE parent_company_id = public.get_my_company_id())
    )
);

-- RLS: deliveries
CREATE POLICY "deliveries_ceva_all"  ON public.deliveries FOR ALL USING (public.get_my_role() = 'ceva_admin');
CREATE POLICY "deliveries_cargo_all" ON public.deliveries FOR ALL USING (public.get_my_role() = 'cargo_admin');
CREATE POLICY "deliveries_vendor_select" ON public.deliveries FOR SELECT USING (
    public.get_my_role() = 'company_admin' 
    AND (
        company_id = public.get_my_company_id() 
        OR company_id IN (SELECT id FROM public.companies WHERE parent_company_id = public.get_my_company_id())
    )
);

-- RLS: gate_logs
CREATE POLICY "logs_ceva_all"      ON public.gate_logs FOR ALL    USING (public.get_my_role() = 'ceva_admin');
CREATE POLICY "logs_cargo_select"  ON public.gate_logs FOR SELECT USING (public.get_my_role() = 'cargo_admin' AND type = 'truck');
CREATE POLICY "logs_auth_insert"   ON public.gate_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS: security_alerts
CREATE POLICY "alerts_ceva_all"    ON public.security_alerts FOR ALL    USING (public.get_my_role() = 'ceva_admin');
CREATE POLICY "alerts_cargo_all"   ON public.security_alerts FOR ALL    USING (public.get_my_role() = 'cargo_admin');
CREATE POLICY "alerts_auth_insert" ON public.security_alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "alerts_auth_select" ON public.security_alerts FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================
-- SEED DATA
-- =============================================================
INSERT INTO public.companies (name, email, phone, type, status, created_at) VALUES
  ('QuickTrans Logistics',  'info@quicktrans.com',    '+1 555-0192', 'vendor', 'approved', '2026-07-01T00:00:00Z'),
  ('SafeGuard Deliveries',  'contact@safeguard.com',  '+1 555-0143', 'vendor', 'approved', '2026-07-03T00:00:00Z'),
  ('Express Freight Co',    'ops@expressfreight.com', '+1 555-0177', 'vendor', 'pending',  '2026-07-08T00:00:00Z')
ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
  v_qt UUID := (SELECT id FROM public.companies WHERE email = 'info@quicktrans.com');
  v_sg UUID := (SELECT id FROM public.companies WHERE email = 'contact@safeguard.com');
BEGIN
  INSERT INTO public.companies (name, email, phone, type, parent_company_id, status, created_at) VALUES
    ('Elite Fleet 3PL',      'ops@elitefleet.com',         '+1 555-4421', 'trucking', v_qt, 'approved',      '2026-07-05T00:00:00Z'),
    ('Express Haulers',       'contact@expresshaulers.com', '+1 555-4477', 'trucking', v_sg, 'pending_vendor','2026-07-08T00:00:00Z'),
    ('Global Cargo Carriers', 'admin@globalcargo.com',      '+1 555-4499', 'trucking', NULL, 'pending_ceva',  '2026-07-09T00:00:00Z')
  ON CONFLICT (email) DO NOTHING;
END;
$$;

-- =============================================================
-- STEP 2: Create admin users in Supabase Dashboard
-- Go to: Authentication > Users > Add User (Confirm email off)
--
--   Email: ceva_admin@cevalogistics.com   Password: CevaAdmin@2026
--   Email: company_admin@quicktrans.com   Password: Vendor@2026
--   Email: cargo_admin@elitefleet.com     Password: Cargo@2026
--
-- Then run this to assign roles (replace UUIDs from Auth > Users):
--
-- UPDATE public.profiles SET role = 'ceva_admin',    full_name = 'CEVA Admin'    WHERE id = '<ceva_admin_uid>';
-- UPDATE public.profiles SET role = 'company_admin', full_name = 'Company Admin' WHERE id = '<company_admin_uid>';
-- UPDATE public.profiles SET role = 'cargo_admin',   full_name = 'Cargo Admin'   WHERE id = '<cargo_admin_uid>';
-- UPDATE public.profiles SET company_id = (SELECT id FROM companies WHERE email='info@quicktrans.com') WHERE id = '<company_admin_uid>';
-- UPDATE public.profiles SET company_id = (SELECT id FROM companies WHERE email='ops@elitefleet.com')  WHERE id = '<cargo_admin_uid>';
-- =============================================================
