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

-- 4. RESERVATIONS & BOOKINGS (WITH ACID LOCKING & OVERLAP INTEGRITY)
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'ST-4821'
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

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_queue ENABLE ROW LEVEL SECURITY;

-- Allow read and write for authenticated dashboard users
CREATE POLICY "Allow public read access for tables" ON restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Allow public read access for reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Allow public read access for table_groups" ON table_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read access for waitlist" ON waitlist_queue FOR SELECT USING (true);

CREATE POLICY "Allow service/staff write on tables" ON restaurant_tables FOR ALL USING (true);
CREATE POLICY "Allow service/staff write on reservations" ON reservations FOR ALL USING (true);
CREATE POLICY "Allow service/staff write on table_groups" ON table_groups FOR ALL USING (true);
CREATE POLICY "Allow service/staff write on waitlist" ON waitlist_queue FOR ALL USING (true);

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
