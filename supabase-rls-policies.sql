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

-- Only authenticated staff can view and manage waitlist entries
CREATE POLICY "Staff can view waitlist"
    ON waitlist_queue FOR SELECT
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'host', 'waiter'));

CREATE POLICY "Staff can update waitlist"
    ON waitlist_queue FOR UPDATE
    TO authenticated
    USING (public.current_staff_role() IN ('manager', 'host', 'waiter'))
    WITH CHECK (public.current_staff_role() IN ('manager', 'host', 'waiter'));

CREATE POLICY "Managers can remove waitlist entries"
    ON waitlist_queue FOR DELETE
    TO authenticated
    USING (public.current_staff_role() = 'manager');
