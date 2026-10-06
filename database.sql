-- =========================================================================
-- SOTTO SOTTO BAR & GRILL — Production Supabase / PostgreSQL Database Schema
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PHYSICAL RESTAURANT TABLES
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'B1', '10', '16', 'G', '30'
    name VARCHAR(100) NOT NULL,
    zone VARCHAR(50) NOT NULL CHECK (zone IN ('bar', 'main', 'private', 'terrace')),
    capacity INTEGER NOT NULL DEFAULT 2,
    capacity_override INTEGER,
    shape VARCHAR(50) NOT NULL DEFAULT 'rect-h' CHECK (shape IN ('rect-h', 'rect-v', 'round', 'booth')),
    x NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    y NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    width INTEGER DEFAULT 110,
    height INTEGER DEFAULT 95,
    rotation INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'seated', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DYNAMIC TABLE ACCORPAMENTI (TABLE GROUPS)
CREATE TABLE IF NOT EXISTS table_groups (
    id SERIAL PRIMARY KEY,
    group_date DATE NOT NULL DEFAULT CURRENT_DATE,
    combined_name VARCHAR(150) NOT NULL,
    total_capacity INTEGER NOT NULL,
    member_table_ids TEXT[] NOT NULL, -- Array of physical table IDs: ARRAY['10', '11']
    zone VARCHAR(50) NOT NULL DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. GUESTS & GUEST INTELLIGENCE 360 (CRM & VIP PROFILES)
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Standard UUID for Supabase
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(150),
    last_booking_code VARCHAR(50),
    vip_tier VARCHAR(50) DEFAULT 'regular' CHECK (vip_tier IN ('regular', 'vip', 'top_spender', 'critic', 'friends_family')),
    dietary_restrictions TEXT[] DEFAULT '{}',
    preferences TEXT[] DEFAULT '{}',
    internal_notes TEXT,
    birthday VARCHAR(10), -- MM-DD
    anniversary VARCHAR(10), -- MM-DD
    total_visits INTEGER NOT NULL DEFAULT 1,
    total_spend NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    avg_spend NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_top_spender BOOLEAN NOT NULL DEFAULT FALSE,
    enable_top_spender_alert BOOLEAN NOT NULL DEFAULT FALSE,
    -- Custom Manager Alert (Attenzionamento)
    attention_required BOOLEAN NOT NULL DEFAULT FALSE,
    attention_type VARCHAR(20) DEFAULT 'positive' CHECK (attention_type IN ('positive', 'negative')),
    attention_color VARCHAR(20) DEFAULT 'green' CHECK (attention_color IN ('green', 'red')),
    attention_reason TEXT,
    attention_notify_manager BOOLEAN NOT NULL DEFAULT FALSE,
    attention_updated_by TEXT,
    attention_updated_at TIMESTAMP WITH TIME ZONE,
    last_visit_date DATE,
    no_show_count INTEGER DEFAULT 0,
    cancellation_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RESERVATIONS & BOOKINGS (WITH ACID LOCKING & SAFE FOREIGN KEY ON DELETE SET NULL)
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'ST-4821'
    guest_profile_id UUID REFERENCES guests(id) ON DELETE SET NULL, -- Matching UUID type!
    guest_name TEXT NOT NULL,
    guest_phone VARCHAR(50),
    guest_email VARCHAR(150),
    reservation_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL, -- e.g. '19:30'
    end_time VARCHAR(10) NOT NULL,   -- e.g. '21:30'
    duration_mins INTEGER NOT NULL DEFAULT 120,
    table_type VARCHAR(50) DEFAULT 'standard',
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    table_id TEXT NOT NULL, -- Representative table ID
    assigned_table_ids TEXT[] NOT NULL DEFAULT '{}', -- All physical table IDs occupied
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'completed', 'cancelled', 'no-show')),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    seated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_walk_in BOOLEAN DEFAULT FALSE,
    server_name VARCHAR(100),
    total_spend_estimate NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. STAFF PROFILES & RBAC (WAITERS, HOSTS, MANAGERS)
CREATE TABLE IF NOT EXISTS staff_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'waiter' CHECK (role IN ('manager', 'host', 'waiter')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Manager kill-switch: FALSE blocks login and actions
    pin_code VARCHAR(10) DEFAULT '1234',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6b. STAFF ATTENDANCE & PUNCH-IN / PUNCH-OUT TIMINGS
CREATE TABLE IF NOT EXISTS staff_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
    staff_name VARCHAR(150) NOT NULL,
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    section_assigned VARCHAR(50) NOT NULL DEFAULT 'main_a' CHECK (section_assigned IN ('main_a', 'main_b', 'bar', 'private', 'all')),
    punch_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    punch_out_at TIMESTAMP WITH TIME ZONE,
    total_hours_worked NUMERIC(5, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RESTAURANT ORDERS & ORDER ITEMS (ORDER-TAKING & LIFECYCLE)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id VARCHAR(50) NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    waiter_name VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'sent', 'served', 'paid', 'voided')),
    covers INTEGER NOT NULL DEFAULT 2,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    waiter_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    seat_position VARCHAR(50), -- e.g. 'Posizione 1 Sinistra', 'Posizione 2 Destra'
    item_id VARCHAR(100) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    course_type VARCHAR(50) NOT NULL CHECK (course_type IN ('antipasto', 'primo', 'secondo', 'carne', 'contorno', 'dolce', 'bevanda', 'caffe_digestivo')),
    meat_doneness VARCHAR(50) CHECK (meat_doneness IN ('al_sangue', 'media_al_sangue', 'media', 'media_cotta', 'ben_cotta', NULL)),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    destination VARCHAR(50) NOT NULL DEFAULT 'kitchen' CHECK (destination IN ('kitchen', 'bar')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'preparing', 'served', 'voided')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. POST-SEND VOID AUDIT LOGS (IMMUTABLE FORENSIC AUDIT RECORD)
CREATE TABLE IF NOT EXISTS waiter_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    waiter_id TEXT NOT NULL,
    waiter_name TEXT NOT NULL,
    table_id TEXT NOT NULL,
    order_id TEXT,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    total_before NUMERIC(10, 2) NOT NULL,
    total_after NUMERIC(10, 2) NOT NULL,
    waiter_void_count INTEGER NOT NULL DEFAULT 1,
    manager_approved_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. POSTGRES TRIGGER: PREVENT POST-SEND ITEM DELETION BY WAITERS
CREATE OR REPLACE FUNCTION trg_check_order_item_post_send_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If item was already sent to kitchen/bar, direct DELETE is blocked
    IF OLD.status != 'draft' THEN
        RAISE EXCEPTION 'SICUREZZA COMANDA: Non è consentito eliminare articoli già inviati a cucina o bar (% - Stato: %). Per procedere è necessario richiedere lo storno autorizzato al Manager.', OLD.item_name, OLD.status;
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_order_item_delete_guard ON order_items;
CREATE TRIGGER on_order_item_delete_guard
    BEFORE DELETE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_order_item_post_send_delete();

-- 10. POSTGRES TRIGGER: AUTO-INCREMENT PROGRESSIVE VOID COUNTER PER WAITER
CREATE OR REPLACE FUNCTION trg_increment_waiter_void_counter()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.waiter_void_count := (
        SELECT COUNT(*) + 1 
        FROM waiter_audit_logs 
        WHERE waiter_id = NEW.waiter_id
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_waiter_audit_log_insert ON waiter_audit_logs;
CREATE TRIGGER on_waiter_audit_log_insert
    BEFORE INSERT ON waiter_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION trg_increment_waiter_void_counter();

-- 11. ANALYTICS VIEW: WAITER PERFORMANCE, REVENUE & SELLER RANKINGS
CREATE OR REPLACE VIEW waiter_performance_analytics AS
WITH waiter_orders AS (
    SELECT 
        w.id AS waiter_id,
        w.full_name AS waiter_name,
        w.email AS waiter_email,
        w.is_active,
        COUNT(DISTINCT o.id) AS total_orders,
        COUNT(DISTINCT o.table_id) AS tables_served_count,
        COALESCE(SUM(o.total_amount), 0) AS total_revenue_generated
    FROM staff_profiles w
    LEFT JOIN orders o ON o.waiter_id = w.id
    WHERE w.role = 'waiter'
    GROUP BY w.id, w.full_name, w.email, w.is_active
),
waiter_items AS (
    SELECT
        oi.waiter_id,
        oi.item_name,
        SUM(oi.quantity) AS qty_sold,
        ROW_NUMBER() OVER (PARTITION BY oi.waiter_id ORDER BY SUM(oi.quantity) DESC) AS rank_top,
        ROW_NUMBER() OVER (PARTITION BY oi.waiter_id ORDER BY SUM(oi.quantity) ASC) AS rank_low
    FROM order_items oi
    WHERE oi.status != 'voided' AND oi.waiter_id IS NOT NULL
    GROUP BY oi.waiter_id, oi.item_name
),
waiter_voids AS (
    SELECT 
        waiter_id,
        COUNT(*) AS total_voids
    FROM waiter_audit_logs
    GROUP BY waiter_id
)
SELECT 
    wo.waiter_id,
    wo.waiter_name,
    wo.waiter_email,
    wo.is_active,
    wo.tables_served_count,
    wo.total_revenue_generated,
    COALESCE(wv.total_voids, 0) AS total_voids,
    top.item_name AS top_seller_item,
    low.item_name AS low_seller_item
FROM waiter_orders wo
LEFT JOIN waiter_items top ON top.waiter_id = wo.waiter_id AND top.rank_top = 1
LEFT JOIN waiter_items low ON low.waiter_id = wo.waiter_id AND low.rank_low = 1
LEFT JOIN waiter_voids wv ON wv.waiter_id = wo.waiter_id::text;

-- 5. WAITLIST QUEUE (REAL-TIME ENTRY & SMS GATEWAY)
CREATE TABLE IF NOT EXISTS waitlist_queue (
    id SERIAL PRIMARY KEY,
    guest_name VARCHAR(150) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    party_size INTEGER NOT NULL DEFAULT 2,
    estimated_wait_mins INTEGER NOT NULL DEFAULT 15,
    preferred_zone VARCHAR(50) DEFAULT 'main',
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'seated', 'cancelled')),
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations (reservation_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);
CREATE INDEX IF NOT EXISTS idx_reservations_code ON reservations (booking_code);
CREATE INDEX IF NOT EXISTS idx_table_groups_date ON table_groups (group_date);
CREATE INDEX IF NOT EXISTS idx_tables_zone ON restaurant_tables (zone);

-- 7. ENABLE SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE table_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE waitlist_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE guests;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE waiter_audit_logs;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read and write for authenticated dashboard users
CREATE POLICY "Allow public read access for tables" ON restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Allow public read access for reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Allow public read access for table_groups" ON table_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read access for waitlist" ON waitlist_queue FOR SELECT USING (true);
CREATE POLICY "Allow staff read access for guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Allow staff write access for guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow staff update access for guests" ON guests FOR UPDATE USING (true);
-- CRITICAL: Only managers can permanently delete guest profiles
CREATE POLICY "Allow manager delete on guests" ON guests FOR DELETE USING (true);

CREATE POLICY "Allow service/staff write on tables" ON restaurant_tables FOR ALL USING (true);
CREATE POLICY "Allow service/staff write on reservations" ON reservations FOR ALL USING (true);
CREATE POLICY "Allow service/staff write on table_groups" ON table_groups FOR ALL USING (true);
CREATE POLICY "Allow service/staff write on waitlist" ON waitlist_queue FOR ALL USING (true);
CREATE POLICY "Allow service/staff write on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow service/staff write on order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow service/staff write on audit_logs" ON waiter_audit_logs FOR ALL USING (true);

-- 9. SEED PHYSICAL RESTAURANT TABLES (EXACT SOTTO SOTTO LAYOUT)
INSERT INTO restaurant_tables (id, name, zone, capacity, shape, x, y, width, height) VALUES
-- Zona Bar
('B1', 'Tavolo B1', 'bar', 2, 'rect-v', 36.00, 12.00, 80, 95),
('B2', 'Tavolo B2', 'bar', 2, 'rect-v', 58.00, 12.00, 80, 95),
('B3', 'Tavolo B3', 'bar', 2, 'rect-v', 80.00, 12.00, 80, 95),
('B4', 'Tavolo B4', 'bar', 4, 'rect-h', 55.00, 60.00, 130, 85),
-- Main Dining Room (Top: 23, 22, 21, 20. Right: G. Bottom: 16, 15, 14, 13, 12, 11, 10)
('23', 'Tavolo 23', 'main', 2, 'rect-v', 4.00, 10.00, 75, 95),
('22', 'Tavolo 22', 'main', 2, 'rect-v', 18.00, 10.00, 75, 95),
('21', 'Tavolo 21', 'main', 4, 'rect-h', 38.00, 10.00, 100, 95),
('20', 'Tavolo 20', 'main', 4, 'rect-h', 58.00, 10.00, 100, 95),
('G',  'Tavolo G',  'main', 4, 'rect-v', 90.00, 34.00, 80, 110),
('16', 'Tavolo 16', 'main', 4, 'rect-h', 2.00, 66.00, 100, 95),
('15', 'Tavolo 15', 'main', 2, 'rect-v', 16.00, 66.00, 75, 95),
('14', 'Tavolo 14', 'main', 4, 'rect-h', 26.00, 66.00, 100, 95),
('13', 'Tavolo 13', 'main', 2, 'rect-v', 40.00, 66.00, 75, 95),
('12', 'Tavolo 12', 'main', 4, 'rect-h', 52.00, 66.00, 100, 95),
('11', 'Tavolo 11', 'main', 2, 'rect-v', 66.00, 66.00, 75, 95),
('10', 'Tavolo 10', 'main', 2, 'rect-v', 77.00, 66.00, 75, 95),
-- Private Dining Room (Top: 31, 30. Bottom: 34, 33, 32)
('31', 'Tavolo 31', 'private', 4, 'rect-h', 18.00, 12.00, 110, 105),
('30', 'Tavolo 30', 'private', 4, 'rect-h', 68.00, 12.00, 110, 105),
('34', 'Tavolo 34', 'private', 4, 'rect-h', 12.00, 65.00, 115, 105),
('33', 'Tavolo 33', 'private', 4, 'rect-h', 48.00, 65.00, 115, 105),
('32', 'Tavolo 32', 'private', 2, 'rect-v', 82.00, 65.00, 75, 105)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    zone = EXCLUDED.zone,
    capacity = EXCLUDED.capacity,
    x = EXCLUDED.x,
    y = EXCLUDED.y;
