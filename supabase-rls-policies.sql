-- =========================================================================
-- SOTTO SOTTO BAR & GRILL — Production Supabase Row Level Security (RLS)
-- Multi-Role Access Control (RBAC): Manager, Host, Waiter & Public Booking
-- =========================================================================

-- 1. PROFILES TABLE FOR AUTHENTICATED STAFF (Synced with auth.users)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'waiter' CHECK (role IN ('manager', 'host', 'waiter')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on staff_profiles
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Helper Function: Get current authenticated user's staff role
CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.staff_profiles 
    WHERE id = auth.uid() AND is_active = TRUE;
$$;

-- Trigger: Automatically create a staff_profile when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.staff_profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'waiter')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_staff_user();

-- Staff Profile RLS Policies
CREATE POLICY "Staff can view their own profile"
    ON public.staff_profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.current_staff_role() = 'manager');

CREATE POLICY "Only managers can modify staff profiles"
    ON public.staff_profiles FOR ALL
    TO authenticated
    USING (public.current_staff_role() = 'manager')
    WITH CHECK (public.current_staff_role() = 'manager');


-- =========================================================================
-- 2. RESTAURANT TABLES (PHYSICAL FLOOR PLAN)
-- =========================================================================
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Policy A: Anyone (including public customers) can view available tables & layout
CREATE POLICY "Public read-only access to physical tables"
    ON restaurant_tables FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy B: Only authenticated staff (Managers and Hosts) can modify table positions or capacity
CREATE POLICY "Staff can manage floor layout"
    ON restaurant_tables FOR ALL
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'host'))
    WITH CHECK (public.current_staff_role() IN ('manager', 'host'));


-- =========================================================================
-- 3. RESERVATIONS & CUSTOMER PRIVACY (PREVENTS PII LEAKS)
-- =========================================================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Policy A: Public (anon) customers can CREATE a reservation via the online booking widget
CREATE POLICY "Public can book a reservation"
    ON reservations FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        guest_name IS NOT NULL AND
        reservation_date >= CURRENT_DATE AND
        party_size > 0 AND
        start_time IS NOT NULL AND
        end_time IS NOT NULL
    );

-- Policy B: Public (anon) customers can ONLY view their OWN reservation using their booking code
CREATE POLICY "Public can view only their own booking via booking_code"
    ON reservations FOR SELECT
    TO anon
    USING (booking_code = current_setting('request.headers', true)::json->>'x-booking-code');

-- Policy C: Authenticated Staff (Managers, Hosts, Waiters) can VIEW ALL reservations
CREATE POLICY "Authenticated staff can view all reservations"
    ON reservations FOR SELECT
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'host', 'waiter'));

-- Policy D: Staff can UPDATE reservations (e.g., seating guests, changing tables)
CREATE POLICY "Staff can update reservations"
    ON reservations FOR UPDATE
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'host', 'waiter'))
    WITH CHECK (public.current_staff_role() IN ('manager', 'host', 'waiter'));

-- Policy E: Only Managers can DELETE or CANCEL reservations permanently
CREATE POLICY "Only managers can delete reservations"
    ON reservations FOR DELETE
    TO authenticated
    USING (public.current_staff_role() = 'manager');


-- =========================================================================
-- 4. WAITLIST QUEUE (SMS GATEWAY & WALK-INS)
-- =========================================================================
ALTER TABLE waitlist_queue ENABLE ROW LEVEL SECURITY;

-- Public can join the waitlist
CREATE POLICY "Public can join waitlist"
    ON waitlist_queue FOR INSERT
    TO anon, authenticated
    WITH CHECK (guest_name IS NOT NULL AND guest_phone IS NOT NULL AND party_size > 0);

-- =========================================================================
-- 5. GUESTS & GUEST INTELLIGENCE 360 (CRM & VIP PRIVACY)
-- =========================================================================
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Staff (Manager, Host, Waiter) can read guest profiles, notes and preferences
CREATE POLICY "Staff can view guest CRM profiles"
    ON guests FOR SELECT
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'host', 'waiter'));

-- Staff can register new guests or update notes/preferences
CREATE POLICY "Staff can create new guest profiles"
    ON guests FOR INSERT
    TO authenticated
    WITH CHECK (public.current_staff_role() IN ('manager', 'host', 'waiter'));

CREATE POLICY "Staff can update guest profile notes and tags"
    ON guests FOR UPDATE
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'host', 'waiter'))
    WITH CHECK (public.current_staff_role() IN ('manager', 'host', 'waiter'));

-- CRITICAL FIX FOR GUEST DELETION:
-- Only Managers can permanently DELETE guest profiles from the database.
-- Associated reservations have 'ON DELETE SET NULL' so foreign key 23503 errors do NOT occur.
CREATE POLICY "Only managers can permanently delete guest profiles"
    ON guests FOR DELETE
    TO authenticated
    USING (public.current_staff_role() = 'manager');


-- =========================================================================
-- 6. WAITER ACCOUNT MANAGEMENT & MANAGER RBAC (RPC FUNCTIONS)
-- =========================================================================

-- Function: Manager creates waiter credentials (email + password)
-- Uses SECURITY DEFINER to interact with Supabase Auth without exposing service role key
CREATE OR REPLACE FUNCTION public.admin_create_waiter_account(
    p_email TEXT,
    p_password TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_pin_code TEXT DEFAULT '1234'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_new_user RECORD;
BEGIN
    -- Verify caller is a Manager
    IF public.current_staff_role() != 'manager' THEN
        RAISE EXCEPTION 'Accesso negato: solo i Manager possono creare account per i camerieri.';
    END IF;

    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Un account con questa email esiste già.');
    END IF;

    -- Generate UUID for new waiter
    v_user_id := gen_random_uuid();

    -- Insert into auth.users (Supabase Auth internal)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name, 'role', 'waiter'),
        NOW(),
        NOW()
    );

    -- Insert or update profile in public.staff_profiles
    INSERT INTO public.staff_profiles (
        id,
        first_name,
        last_name,
        full_name,
        email,
        role,
        is_active,
        pin_code
    )
    VALUES (
        v_user_id,
        p_first_name,
        p_last_name,
        p_first_name || ' ' || p_last_name,
        p_email,
        'waiter',
        TRUE,
        p_pin_code
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        full_name = EXCLUDED.full_name,
        is_active = TRUE,
        pin_code = EXCLUDED.pin_code;

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

-- Function: Manager changes or resets a waiter's password
CREATE OR REPLACE FUNCTION public.admin_reset_waiter_password(
    p_waiter_id UUID,
    p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verify caller is a Manager
    IF public.current_staff_role() != 'manager' THEN
        RAISE EXCEPTION 'Accesso negato: solo i Manager possono modificare o resettare le password dei camerieri.';
    END IF;

    IF length(p_new_password) < 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'La password deve contenere almeno 6 caratteri.');
    END IF;

    -- Update encrypted password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_waiter_id;

    -- Also update pin_code for tablet quick-switch (first 4 chars)
    UPDATE public.staff_profiles
    SET pin_code = substring(p_new_password from 1 for 4),
        updated_at = NOW()
    WHERE id = p_waiter_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Manager toggles waiter is_active status (Enable/Disable access)
CREATE OR REPLACE FUNCTION public.admin_toggle_waiter_active(
    p_waiter_id UUID,
    p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF public.current_staff_role() != 'manager' THEN
        RAISE EXCEPTION 'Accesso negato: solo i Manager possono abilitare o disabilitare il personale.';
    END IF;

    UPDATE public.staff_profiles
    SET is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_waiter_id;

    RETURN jsonb_build_object('success', true, 'is_active', p_is_active);
END;
$$;


-- =========================================================================
-- 7. POST-SEND ORDER SECURITY & WAITER AUDIT LOGS (RLS)
-- =========================================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_audit_logs ENABLE ROW LEVEL SECURITY;

-- Orders & Items RLS
CREATE POLICY "Staff can view orders"
    ON orders FOR SELECT
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'host', 'waiter'));

CREATE POLICY "Staff can manage orders"
    ON orders FOR ALL
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'waiter'))
    WITH CHECK (public.current_staff_role() IN ('manager', 'waiter'));

CREATE POLICY "Staff can view order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'waiter'));

CREATE POLICY "Waiters can insert draft order items"
    ON order_items FOR INSERT
    TO authenticated
    WITH CHECK (public.current_staff_role() IN ('manager', 'waiter'));

CREATE POLICY "Waiters can update order items"
    ON order_items FOR UPDATE
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'waiter'))
    WITH CHECK (public.current_staff_role() IN ('manager', 'waiter'));

-- Audit Logs RLS: IMMUTABLE FORENSIC LOG
-- 1. Managers can view ALL audit logs
CREATE POLICY "Managers can view all audit logs"
    ON waiter_audit_logs FOR SELECT
    TO authenticated
    USING (public.current_staff_role() = 'manager');

-- 2. System and authorized staff can insert audit log records
CREATE POLICY "System can record authorized voids"
    ON waiter_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. NO ONE CAN UPDATE OR DELETE AUDIT LOGS (Tamper-proof compliance)
CREATE POLICY "No updates allowed on audit logs"
    ON waiter_audit_logs FOR UPDATE
    USING (false);

CREATE POLICY "No deletion allowed on audit logs"
    ON waiter_audit_logs FOR DELETE
    USING (false);
