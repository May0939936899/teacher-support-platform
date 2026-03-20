'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const STORAGE_KEY = 'budget-tracker-data';
const CATEGORIES = ['วัสดุ', 'ค่าเดินทาง', 'ค่าอาหาร', 'ค่าวิทยากร', 'อื่นๆ'];
const CAT_COLORS = ['#00b4e6', '#e6007e', '#ffc107', '#7c4dff', '#4caf50'];

export default function BudgetTracker() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectForm, setProjectForm] = useState({ name: '', budget: '' });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ item: '', amount: '', category: CATEGORIES[0], date: new Date().toISOString().split('T')[0], receipt: '' });

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) { const d = JSON.parse(s); setProjects(d); if (d.length > 0) setActiveProjectId(d[0].id); }
    } catch {}
  }, []);

  const save = (p) => { setProjects(p); localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); };

  const activeProject = projects.find(p => p.id === activeProjectId);
  const expenses = activeProject?.expenses || [];
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const remaining = (activeProject?.budget || 0) - totalSpent;
  const pctUsed = activeProject?.budget > 0 ? Math.round((totalSpent / activeProject.budget) * 100) : 0;

  const createProject = () => {
    if (!projectForm.name.trim() || !projectForm.budget) { toast.error('กรุณาระบุชื่อโครงการและงบประมาณ'); return; }
    const p = { name: projectForm.name, budget: Number(projectForm.budget), id: Date.now(), expenses: [], createdAt: new Date().toISOString() };
    const updated = [p, ...projects];
    save(updated);
    setActiveProjectId(p.id);
    setProjectForm({ name: '', budget: '' });
    setShowProjectForm(false);
    toast.success('สร้างโครงการแล้ว');
  };

  const deleteProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    save(updated);
    if (activeProjectId === id) setActiveProjectId(updated[0]?.id || null);
    toast.success('ลบโครงการแล้ว');
  };

  const addExpense = () => {
    if (!expenseForm.item.trim() || !expenseForm.amount) { toast.error('กรุณาระบุรายการและจำนวนเงิน'); return; }
    const updated = projects.map(p => {
      if (p.id === activeProjectId) return { ...p, expenses: [...p.expenses, { ...expenseForm, amount: Number(expenseForm.amount), id: Date.now() }] };
      return p;
    });
    save(updated);
    setExpenseForm({ item: '', amount: '', category: CATEGORIES[0], date: new Date().toISOString().split('T')[0], receipt: '' });
    toast.success('เพิ่มค่าใช้จ่ายแล้ว');
  };

  const deleteExpense = (expId) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) return { ...p, expenses: p.expenses.filter(e => e.id !== expId) };
      return p;
    });
    save(updated);
    toast.success('ลบรายการแล้ว');
  };

  const exportCSV = () => {
    if (!activeProject) return;
    const header = 'รายการ,จำนวนเงิน,หมวดหมู่,วันที่,หมายเหตุใบเสร็จ';
    const rows = expenses.map(e => `"${e.item}",${e.amount},"${e.category}","${e.date}","${e.receipt || ''}"`);
    const csv = [header, ...rows, '', `รวมทั้งหมด,${totalSpent}`, `งบประมาณ,${activeProject.budget}`, `คงเหลือ,${remaining}`].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `budget-${activeProject.name}-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('ส่งออก CSV แล้ว');
  };

  const catBreakdown = CATEGORIES.map((cat, i) => ({
    category: cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
    color: CAT_COLORS[i],
  })).filter(c => c.total > 0);

  const formatNum = (n) => n.toLocaleString('th-TH');

  const btnStyle = (bg) => ({
    padding: '10px 20px', border: 'none', borderRadius: 10, color: '#fff', fontFamily: FONT,
    fontSize: 15, cursor: 'pointer', background: bg || `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, fontWeight: 600,
  });
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontFamily: FONT, fontSize: 15, outline: 'none', boxSizing: 'border-box' };
  const cardStyle = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' };

  const pieGradient = (() => {
    if (catBreakdown.length === 0) return '#eee';
    let acc = 0;
    const stops = catBreakdown.map(c => {
      const start = acc;
      acc += (c.total / totalSpent) * 360;
      return `${c.color} ${start}deg ${acc}deg`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  })();

  return (
    <div style={{ fontFamily: FONT, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, color: CI.dark, marginBottom: 4 }}>💰 ตั้งงบโครงการ บันทึกค่าใช้จ่าย</h2>
      <p style={{ color: '#888', fontSize: 15, marginBottom: 16 }}>บริหารงบประมาณโครงการอย่างเป็นระบบ</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {projects.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setActiveProjectId(p.id)}
              style={{ ...btnStyle(activeProjectId === p.id ? CI.cyan : '#ccc'), padding: '8px 16px', fontSize: 14 }}>
              {p.name}
            </button>
            <button onClick={() => deleteProject(p.id)}
              style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 16, padding: 4 }}>×</button>
          </div>
        ))}
        <button style={btnStyle(`linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`)} onClick={() => setShowProjectForm(true)}>
          ➕ โครงการใหม่
        </button>
      </div>

      {showProjectForm && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, color: CI.dark, marginTop: 0 }}>สร้างโครงการใหม่</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input style={inputStyle} placeholder="ชื่อโครงการ" value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))} />
            <input style={inputStyle} type="number" placeholder="งบประมาณ (บาท)" value={projectForm.budget} onChange={e => setProjectForm(f => ({ ...f, budget: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btnStyle()} onClick={createProject}>✅ สร้าง</button>
            <button style={btnStyle('#888')} onClick={() => setShowProjectForm(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {activeProject && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'ใช้ไปแล้ว', value: `฿${formatNum(totalSpent)}`, color: CI.magenta },
              { label: 'คงเหลือ', value: `฿${formatNum(remaining)}`, color: remaining >= 0 ? '#4caf50' : '#e53935' },
              { label: 'ใช้ไป %', value: `${pctUsed}%`, color: pctUsed > 90 ? '#e53935' : pctUsed > 70 ? CI.gold : CI.cyan },
            ].map((s, i) => (
              <div key={i} style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar & Pie */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cardStyle}>
              <h4 style={{ fontSize: 16, color: CI.dark, marginTop: 0 }}>งบประมาณ ฿{formatNum(activeProject.budget)}</h4>
              <div style={{ height: 24, background: '#eee', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{
                  height: '100%', width: `${Math.min(pctUsed, 100)}%`,
                  background: pctUsed > 90 ? '#e53935' : `linear-gradient(90deg, ${CI.cyan}, ${CI.purple})`,
                  borderRadius: 12, transition: 'width 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                }}>
                  {pctUsed > 10 ? `${pctUsed}%` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {catBreakdown.map(c => (
                  <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 4, background: c.color }} />
                    {c.category}: ฿{formatNum(c.total)}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: pieGradient, marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: '#888' }}>สัดส่วนค่าใช้จ่าย</div>
            </div>
          </div>

          {/* Add Expense */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <h4 style={{ fontSize: 16, color: CI.dark, marginTop: 0 }}>➕ เพิ่มค่าใช้จ่าย</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input style={inputStyle} placeholder="รายการ" value={expenseForm.item} onChange={e => setExpenseForm(f => ({ ...f, item: e.target.value }))} />
              <input style={inputStyle} type="number" placeholder="จำนวนเงิน (บาท)" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} />
              <select style={inputStyle} value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
              <input style={inputStyle} type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} />
              <input style={inputStyle} placeholder="หมายเหตุใบเสร็จ" value={expenseForm.receipt} onChange={e => setExpenseForm(f => ({ ...f, receipt: e.target.value }))} />
              <button style={btnStyle()} onClick={addExpense}>เพิ่ม</button>
            </div>
          </div>

          {/* Expense List */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ fontSize: 16, color: CI.dark, margin: 0 }}>📝 รายการค่าใช้จ่าย ({expenses.length})</h4>
              <button style={{ ...btnStyle(CI.purple), padding: '8px 16px', fontSize: 13 }} onClick={exportCSV}>📥 Export CSV</button>
            </div>
            {expenses.length === 0 && <p style={{ color: '#aaa', fontSize: 14, textAlign: 'center', padding: 20 }}>ยังไม่มีรายการ</p>}
            {expenses.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ width: 10, height: 10, borderRadius: 4, background: CAT_COLORS[CATEGORIES.indexOf(e.category)] || '#888', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{e.item}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{e.category} | {e.date} {e.receipt ? `| ${e.receipt}` : ''}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: CI.magenta }}>฿{formatNum(e.amount)}</div>
                <button style={{ ...btnStyle('#e53935'), padding: '6px 12px', fontSize: 12 }} onClick={() => deleteExpense(e.id)}>ลบ</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
