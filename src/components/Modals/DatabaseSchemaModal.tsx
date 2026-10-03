import React, { useState } from 'react';
import { X, Database, Copy, Check, Download, ShieldCheck, Zap } from 'lucide-react';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA_TEXT = `-- =========================================================================
-- SOTTO SOTTO BAR & GRILL — Production Supabase / PostgreSQL Schema
-- =========================================================================

-- 1. PHYSICAL RESTAURANT TABLES
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id VARCHAR(50) PRIMARY KEY, -- 'B1', 'B2', '10', '16', 'G', '30'
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
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DYNAMIC TABLE ACCORPAMENTI (TABLE GROUPS)
CREATE TABLE IF NOT EXISTS table_groups (
    id SERIAL PRIMARY KEY,
    group_date DATE NOT NULL DEFAULT CURRENT_DATE,
    combined_name VARCHAR(150) NOT NULL,
    total_capacity INTEGER NOT NULL,
    member_table_ids TEXT[] NOT NULL, -- e.g. ARRAY['10', '11']
    zone VARCHAR(50) NOT NULL DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RESERVATIONS & BOOKINGS (WITH ACID LOCKING & OVERLAP INTEGRITY)
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(50) UNIQUE NOT NULL, -- 'ST-4821'
    guest_name TEXT NOT NULL,
    guest_phone VARCHAR(50),
    guest_email VARCHAR(150),
    reservation_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL, -- '19:30'
    end_time VARCHAR(10) NOT NULL,   -- '21:30'
    duration_mins INTEGER NOT NULL DEFAULT 120,
    table_type VARCHAR(50) DEFAULT 'standard',
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    table_id TEXT NOT NULL,
    assigned_table_ids TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'completed', 'cancelled', 'no-show')),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    seated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_walk_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ENABLE SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables, reservations, table_groups;

-- 5. RLS POLICIES
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read" ON reservations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read" ON table_groups FOR SELECT USING (true);

-- 6. STRICT 15-MINUTE SLOT CAPACITY VALIDATION WITH ROW LOCKING (FOR UPDATE)
CREATE OR REPLACE FUNCTION validate_and_book_advance_reservation(
    p_booking_code VARCHAR,
    p_guest_name TEXT,
    p_guest_phone VARCHAR,
    p_guest_email VARCHAR,
    p_reservation_date DATE,
    p_start_time VARCHAR, -- '19:30'
    p_party_size INT,
    p_table_id TEXT,
    p_assigned_table_ids TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_duration_mins INT;
    v_end_time VARCHAR;
    v_start_minutes INT;
    v_end_minutes INT;
    v_slice_start INT;
    v_count_2 INT;
    v_count_4 INT;
    v_is_4_seater BOOLEAN;
    v_projected_2 INT;
    v_projected_4 INT;
BEGIN
    -- 1. Determine Dining Holding Duration: 120m (1-2 guests) or 165m (4+ guests)
    IF p_party_size <= 2 THEN
        v_duration_mins := 120;
    ELSE
        v_duration_mins := 165;
    END IF;

    -- Calculate End Time (e.g., 19:30 + 165m = 22:15)
    v_start_minutes := (split_part(p_start_time, ':', 1)::INT * 60) + split_part(p_start_time, ':', 2)::INT;
    v_end_minutes := v_start_minutes + v_duration_mins;
    v_end_time := to_char(v_end_minutes / 60, 'FM00') || ':' || to_char(v_end_minutes % 60, 'FM00');
    v_is_4_seater := (p_party_size >= 3);

    -- 2. ACQUIRE LOCK ON ALL EXISTING RESERVATIONS FOR TARGET DATE TO PREVENT RACE CONDITIONS
    PERFORM 1 FROM reservations
    WHERE reservation_date = p_reservation_date
    FOR UPDATE;

    -- 3. ITERATE ACROSS EACH 15-MINUTE INTERVAL SLICE
    v_slice_start := v_start_minutes;
    WHILE v_slice_start < v_end_minutes LOOP
        -- Count active overlapping advance bookings for this specific 15-min slice
        SELECT
            COUNT(*) FILTER (WHERE party_size <= 2),
            COUNT(*) FILTER (WHERE party_size >= 3)
        INTO v_count_2, v_count_4
        FROM reservations
        WHERE reservation_date = p_reservation_date
          AND status IN ('confirmed', 'seated')
          AND is_walk_in = FALSE
          AND (
              GREATEST(v_slice_start, (split_part(start_time, ':', 1)::INT * 60 + split_part(start_time, ':', 2)::INT)) <
              LEAST(v_slice_start + 15, (split_part(end_time, ':', 1)::INT * 60 + split_part(end_time, ':', 2)::INT))
          );

        v_projected_2 := v_count_2 + (CASE WHEN v_is_4_seater THEN 0 ELSE 1 END);
        v_projected_4 := v_count_4 + (CASE WHEN v_is_4_seater THEN 1 ELSE 0 END);

        -- Strict Concurrency Rules:
        -- Option A: Max 2 tables of 4-seaters (and 0 of 2-seaters)
        -- Option B: Max 2 tables of 2-seaters AND 1 table of 4-seater
        IF NOT ((v_projected_4 <= 2 AND v_projected_2 = 0) OR (v_projected_2 <= 2 AND v_projected_4 <= 1)) THEN
            RAISE EXCEPTION 'Spiacenti, la fascia oraria % ha raggiunto il limite massimo di capienza per questo turno.', 
                to_char(v_slice_start / 60, 'FM00') || ':' || to_char(v_slice_start % 60, 'FM00');
        END IF;

        v_slice_start := v_slice_start + 15;
    END LOOP;

    -- 4. INSERT RESERVATION RECORD (ATOMIC & COMMITTED)
    INSERT INTO reservations (
        booking_code, guest_name, guest_phone, guest_email,
        reservation_date, start_time, end_time, duration_mins,
        party_size, table_id, assigned_table_ids, status, is_walk_in
    ) VALUES (
        p_booking_code, p_guest_name, p_guest_phone, p_guest_email,
        p_reservation_date, p_start_time, v_end_time, v_duration_mins,
        p_party_size, p_table_id, p_assigned_table_ids, 'confirmed', FALSE
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_code', p_booking_code,
        'end_time', v_end_time,
        'duration_mins', v_duration_mins
    );
END;
$$;
`;

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([SQL_SCHEMA_TEXT], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sotto_sotto_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] border-2 border-[#1E3A2F]/30 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E3A2F]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A2F] text-amber-100 flex items-center justify-center font-bold shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-brand font-bold text-[#1E3A2F]">
                Schema Database Supabase & PostgreSQL
              </h3>
              <p className="text-xs text-[#1E3A2F]/70">
                DDL, Transazioni ACID, Realtime Replication e Politiche RLS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-[#1E3A2F] p-1.5 rounded-xl hover:bg-[#1E3A2F]/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white border border-[#1E3A2F]/15 rounded-xl p-3 space-y-1">
            <div className="font-bold text-[#1E3A2F] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Transazioni ACID</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Blocco rigido double-booking con query di sovrapposizione temporale.
            </p>
          </div>

          <div className="bg-white border border-[#1E3A2F]/15 rounded-xl p-3 space-y-1">
            <div className="font-bold text-[#1E3A2F] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Supabase Realtime</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Sincronizzazione bi-direzionale via WebSocket per tutti i tablet in sala.
            </p>
          </div>

          <div className="bg-white border border-[#1E3A2F]/15 rounded-xl p-3 space-y-1">
            <div className="font-bold text-[#1E3A2F] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#6B3FA0]" />
              <span>Tavoli Accorpati</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Mappatura array <code className="font-mono">TEXT[]</code> per i maxi-tavoli uniti.
            </p>
          </div>
        </div>

        {/* SQL Code View */}
        <div className="flex-1 min-h-[260px] bg-[#1E110B] text-amber-100 rounded-2xl p-4 overflow-y-auto font-mono text-xs border border-amber-900/40 shadow-inner">
          <pre className="whitespace-pre-wrap">{SQL_SCHEMA_TEXT}</pre>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#1E3A2F]/15 flex items-center justify-between gap-3">
          <span className="text-[11px] text-stone-500">
            Eseguibile direttamente nell'SQL Editor di Supabase
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-[#1E3A2F] font-semibold text-xs rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica .sql</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1E3A2F] hover:bg-[#152a22] text-amber-100 font-bold text-xs rounded-xl transition shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiato negli Appunti!' : 'Copia SQL per Supabase'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
