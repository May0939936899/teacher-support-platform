'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const STORAGE_KEY = 'kpi-dashboard-data';
const KPI_CATEGORIES = ['การสอน', 'วิจัย', 'บริการวิชาการ', 'พัฒนาตนเอง', 'อื่นๆ'];
const UNITS = ['%', 'คน', 'ชิ้น', 'ครั้ง', 'ชั่วโมง', 'เรื่อง', 'บาท', 'คะแนน'];

export default function KPIDashboard() {
  const [kpis, setKpis] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', target: '', unit: '%', category: KPI_CATEGORIES[0] });
  const [actualForm, setActualForm] = useState({ kpiId: '', value: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setKpis(JSON.parse(s)); } catch {}
  }, []);

  const save = (k) => { setKpis(k); localStorage.setItem(STORAGE_KEY, JSON.stringify(k)); };

  const addKPI = () => {
    if (!form.name.trim() || !form.target) { toast.error('กรุณาระบุชื่อ KPI และเป้าหมาย'); return; }
    if (editId) {
      save(kpis.map(k => k.id === editId ? { ...k, name: form.name, target: Number(form.target), unit: form.unit, category: form.category } : k));
      toast.success('แก้ไข KPI แล้ว');
    } else {
      save([...kpis, { id: Date.now(), name: form.name, target: Number(form.target), unit: form.unit, category: form.category, records: [] }]);
      toast.success('เพิ่ม KPI แล้ว');
    }
    setForm({ name: '', target: '', unit: '%', category: KPI_CATEGORIES[0] });
    setShowForm(false);
    setEditId(null);
  };

  const deleteKPI = (id) => { save(kpis.filter(k => k.id !== id)); toast.success('ลบ KPI แล้ว'); };

  const editKPI = (k) => {
    setEditId(k.id);
    setForm({ name: k.name, target: k.target, unit: k.unit, category: k.category });
    setShowForm(true);
  };

  const recordActual = () => {
    if (!actualForm.kpiId || !actualForm.value) { toast.error('กรุณาเลือก KPI และระบุค่า'); return; }
    const updated = kpis.map(k => {
      if (k.id === Number(actualForm.kpiId)) {
        return { ...k, records: [...(k.records || []), { value: Number(actualForm.value), date: actualForm.date, id: Date.now() }] };
      }
      return k;
    });
    save(updated);
    setActualForm({ kpiId: '', value: '', date: new Date().toISOString().split('T')[0] });
    toast.success('บันทึกค่าจริงแล้ว');
  };

  const getLatestActual = (kpi) => {
    if (!kpi.records || kpi.records.length === 0) return 0;
    return kpi.records[kpi.records.length - 1].value;
  };

  const getAchievement = (kpi) => {
    const actual = getLatestActual(kpi);
    return kpi.target > 0 ? Math.min(Math.round((actual / kpi.target) * 100), 100) : 0;
  };

  const getColor = (pct) => pct >= 80 ? '#4caf50' : pct >= 50 ? CI.gold : '#e53935';

  const overallPct = kpis.length > 0 ? Math.round(kpis.reduce((s, k) => s + getAchievement(k), 0) / kpis.length) : 0;

  const exportSummary = () => {
    const lines = [
      '═══ สรุป KPI Dashboard ═══',
      `วันที่: ${new Date().toLocaleDateString('th-TH')}`,
      `ผลรวม KPI: ${overallPct}%`,
      '',
    ];
    KPI_CATEGORIES.forEach(cat => {
      const items = kpis.filter(k => k.category === cat);
      if (items.length > 0) {
        lines.push(`📌 ${cat}`);
        items.forEach(k => {
          const pct = getAchievement(k);
          const icon = pct >= 80 ? '✅' : pct >= 50 ? '🟡' : '🔴';
          lines.push(`  ${icon} ${k.name}: ${getLatestActual(k)}/${k.target} ${k.unit} (${pct}%)`);
        });
        lines.push('');
      }
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('คัดลอกสรุป KPI แล้ว');
  };

  const btnStyle = (bg) => ({
    padding: '10px 20px', border: 'none', borderRadius: 10, color: '#fff', fontFamily: FONT,
    fontSize: 15, cursor: 'pointer', background: bg || `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, fontWeight: 600,
  });
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontFamily: FONT, fontSize: 15, outline: 'none', boxSizing: 'border-box' };
  const cardStyle = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' };

  return (
    <div style={{ fontFamily: FONT, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, color: CI.dark, marginBottom: 4 }}>🎯 KPI Dashboard</h2>
      <p style={{ color: '#888', fontSize: 15, marginBottom: 16 }}>ตั้ง KPI เป้าหมาย บันทึกผลจริง ติดตามความสำเร็จ</p>

      {/* Overall */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: getColor(overallPct) }}>{overallPct}%</div>
          <div style={{ fontSize: 13, color: '#888' }}>ผลรวม KPI</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#4caf50' }}>{kpis.filter(k => getAchievement(k) >= 80).length}</div>
          <div style={{ fontSize: 13, color: '#888' }}>ดีเยี่ยม (&ge;80%)</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: CI.gold }}>{kpis.filter(k => { const p = getAchievement(k); return p >= 50 && p < 80; }).length}</div>
          <div style={{ fontSize: 13, color: '#888' }}>ปานกลาง (50-79%)</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#e53935' }}>{kpis.filter(k => getAchievement(k) < 50).length}</div>
          <div style={{ fontSize: 13, color: '#888' }}>ต้องปรับปรุง (&lt;50%)</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button style={btnStyle()} onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', target: '', unit: '%', category: KPI_CATEGORIES[0] }); }}>
          ➕ เพิ่ม KPI
        </button>
        <button style={btnStyle(CI.purple)} onClick={exportSummary}>📄 Export สรุป</button>
      </div>

      {/* Add KPI Form */}
      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, color: CI.dark, marginTop: 0 }}>{editId ? 'แก้ไข KPI' : 'เพิ่ม KPI ใหม่'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <input style={inputStyle} placeholder="ชื่อ KPI" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input style={inputStyle} type="number" placeholder="เป้าหมาย" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
            <select style={inputStyle} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {KPI_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btnStyle()} onClick={addKPI}>{editId ? '💾 บันทึก' : '➕ เพิ่ม'}</button>
            <button style={btnStyle('#888')} onClick={() => { setShowForm(false); setEditId(null); }}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Record Actual */}
      {kpis.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h4 style={{ fontSize: 16, color: CI.dark, marginTop: 0 }}>📊 บันทึกค่าจริง (Actual)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10 }}>
            <select style={inputStyle} value={actualForm.kpiId} onChange={e => setActualForm(f => ({ ...f, kpiId: e.target.value }))}>
              <option value="">เลือก KPI</option>
              {kpis.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <input style={inputStyle} type="number" placeholder="ค่าจริง" value={actualForm.value} onChange={e => setActualForm(f => ({ ...f, value: e.target.value }))} />
            <input style={inputStyle} type="date" value={actualForm.date} onChange={e => setActualForm(f => ({ ...f, date: e.target.value }))} />
            <button style={btnStyle()} onClick={recordActual}>บันทึก</button>
          </div>
        </div>
      )}

      {/* KPI List */}
      {kpis.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 16, color: '#aaa' }}>ยังไม่มี KPI — เพิ่ม KPI เพื่อเริ่มติดตามผล</p>
        </div>
      )}

      {kpis.map(kpi => {
        const pct = getAchievement(kpi);
        const color = getColor(pct);
        const actual = getLatestActual(kpi);
        return (
          <div key={kpi.id} style={{ ...cardStyle, marginBottom: 12, borderLeft: `4px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: CI.dark }}>{kpi.name}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{kpi.category} | เป้า: {kpi.target} {kpi.unit}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>{pct}%</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{actual}/{kpi.target} {kpi.unit}</div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }} onClick={() => editKPI(kpi)}>✏️</button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#e53935' }} onClick={() => deleteKPI(kpi.id)}>🗑️</button>
              </div>
            </div>
            <div style={{ height: 16, background: '#eee', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`,
                borderRadius: 8, transition: 'width 0.5s',
              }} />
            </div>
            {kpi.records && kpi.records.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {kpi.records.slice(-5).map(r => (
                  <span key={r.id} style={{ fontSize: 12, background: '#f5f5f5', padding: '3px 8px', borderRadius: 6, color: '#666' }}>
                    {r.date}: {r.value} {kpi.unit}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
