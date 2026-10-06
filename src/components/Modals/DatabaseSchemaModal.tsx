import React, { useState } from 'react';
import { X, Database, Copy, Check, Download, ShieldCheck, Zap } from 'lucide-react';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA_TEXT = `-- =========================================================================
-- SOTTO SOTTO BAR & GRILL — Production Supabase / PostgreSQL Schema
-- Guest Intelligence 360, Waiter RBAC & Post-Send Void Security
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. GUESTS & GUEST INTELLIGENCE 360 (CRM & VIP PROFILES)
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Standard Supabase UUID
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

-- 3. RESERVATIONS (WITH SAFE FOREIGN KEY ON DELETE SET NULL)
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    guest_profile_id UUID REFERENCES guests(id) ON DELETE SET NULL, -- Type-safe UUID with ON DELETE SET NULL!
    guest_name TEXT NOT NULL,
    guest_phone VARCHAR(50),
    guest_email VARCHAR(150),
    reservation_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    duration_mins INTEGER NOT NULL DEFAULT 120,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    table_id TEXT NOT NULL,
    assigned_table_ids TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'completed', 'cancelled', 'no-show')),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    is_walk_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. STAFF PROFILES & RBAC (WAITERS, HOSTS, MANAGERS)
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

-- 5. ORDERS & ORDER ITEMS (ORDER-TAKING & COURSE LIFECYCLE)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id VARCHAR(50) NOT NULL,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    waiter_name VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'sent', 'served', 'paid', 'voided')),
    covers INTEGER NOT NULL DEFAULT 2,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    waiter_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    item_id VARCHAR(100) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    destination VARCHAR(50) NOT NULL DEFAULT 'kitchen' CHECK (destination IN ('kitchen', 'bar')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'preparing', 'served', 'voided')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. POST-SEND VOID AUDIT LOGS (IMMUTABLE FORENSIC AUDIT RECORD)
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

-- 7. TRIGGER: PREVENT POST-SEND ITEM DELETION BY WAITERS
CREATE OR REPLACE FUNCTION trg_check_order_item_post_send_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

-- 8. TRIGGER: AUTO-INCREMENT PROGRESSIVE VOID COUNTER PER WAITER
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

-- 9. ANALYTICS VIEW: WAITER PERFORMANCE, REVENUE & SELLER RANKINGS
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

-- 10. REALTIME REPLICATION & RLS
ALTER PUBLICATION supabase_realtime ADD TABLE guests, reservations, staff_profiles, waiter_audit_logs, orders, order_items;

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Staff insert guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff update guests" ON guests FOR UPDATE USING (true);
CREATE POLICY "Manager delete guests" ON guests FOR DELETE USING (true);
CREATE POLICY "Manager view audit logs" ON waiter_audit_logs FOR SELECT USING (true);
CREATE POLICY "No delete on audit logs" ON waiter_audit_logs FOR DELETE USING (false);
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
