'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const STORAGE_KEY = 'event-coordinator-data';
const STATUS_LIST = [
  { key: 'pending', label: 'รอดำเนินการ', color: '#ffc107' },
  { key: 'in-progress', label: 'กำลังดำเนินการ', color: CI.cyan },
  { key: 'done', label: 'เสร็จแล้ว', color: '#4caf50' },
];

const emptyEvent = () => ({ name: '', date: '', venue: '', description: '' });
const emptyTask = () => ({ title: '', assignee: '', deadline: '', status: 'pending' });

export default function EventCoordinator() {
  const [events, setEvents] = useState([]);
  const [activeEventId, setActiveEventId] = useState(null);
  const [eventForm, setEventForm] = useState(emptyEvent());
  const [taskForm, setTaskForm] = useState(emptyTask());
  const [showEventForm, setShowEventForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('');

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) { const d = JSON.parse(s); setEvents(d); if (d.length > 0) setActiveEventId(d[0].id); } } catch {}
  }, []);

  const save = (e) => { setEvents(e); localStorage.setItem(STORAGE_KEY, JSON.stringify(e)); };

  const activeEvent = events.find(e => e.id === activeEventId);
  const tasks = activeEvent?.tasks || [];

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterAssignee && !t.assignee.includes(filterAssignee)) return false;
    return true;
  });

  const progress = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  const allAssignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];

  const createEvent = () => {
    if (!eventForm.name.trim()) { toast.error('กรุณาระบุชื่อกิจกรรม'); return; }
    const ev = { ...eventForm, id: Date.now(), tasks: [], createdAt: new Date().toISOString() };
    const updated = [ev, ...events];
    save(updated);
    setActiveEventId(ev.id);
    setEventForm(emptyEvent());
    setShowEventForm(false);
    toast.success('สร้างกิจกรรมแล้ว');
  };

  const deleteEvent = (id) => {
    const updated = events.filter(e => e.id !== id);
    save(updated);
    if (activeEventId === id) setActiveEventId(updated[0]?.id || null);
    toast.success('ลบกิจกรรมแล้ว');
  };

  const addTask = () => {
    if (!taskForm.title.trim()) { toast.error('กรุณาระบุชื่องาน'); return; }
    const updated = events.map(e => {
      if (e.id === activeEventId) return { ...e, tasks: [...e.tasks, { ...taskForm, id: Date.now() }] };
      return e;
    });
    save(updated);
    setTaskForm(emptyTask());
    toast.success('เพิ่มงานแล้ว');
  };

  const updateTaskStatus = (taskId, status) => {
    const updated = events.map(e => {
      if (e.id === activeEventId) {
        return { ...e, tasks: e.tasks.map(t => t.id === taskId ? { ...t, status } : t) };
      }
      return e;
    });
    save(updated);
    toast.success('อัปเดตสถานะแล้ว');
  };

  const deleteTask = (taskId) => {
    const updated = events.map(e => {
      if (e.id === activeEventId) return { ...e, tasks: e.tasks.filter(t => t.id !== taskId) };
      return e;
    });
    save(updated);
    toast.success('ลบงานแล้ว');
  };

  // Gantt helper
  const getGanttRange = () => {
    if (tasks.length === 0) return { min: new Date(), max: new Date(), days: 1 };
    const dates = tasks.filter(t => t.deadline).map(t => new Date(t.deadline).getTime());
    const eventDate = activeEvent?.date ? new Date(activeEvent.date).getTime() : Date.now();
    dates.push(eventDate, Date.now());
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    const days = Math.max(Math.ceil((max - min) / 86400000), 1) + 2;
    return { min, max, days };
  };

  const btnStyle = (bg) => ({
    padding: '10px 20px', border: 'none', borderRadius: 10, color: '#fff', fontFamily: FONT,
    fontSize: 15, cursor: 'pointer', background: bg || `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, fontWeight: 600,
  });
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontFamily: FONT, fontSize: 15, outline: 'none', boxSizing: 'border-box' };
  const cardStyle = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' };

  return (
    <div style={{ fontFamily: FONT, maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, color: CI.dark, marginBottom: 4 }}>📋 Event Checklist & Assign ผู้รับผิดชอบ</h2>
      <p style={{ color: '#888', fontSize: 15, marginBottom: 16 }}>สร้างกิจกรรม มอบหมายงาน ติดตามความคืบหน้า</p>

      {/* Event tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {events.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setActiveEventId(e.id)}
              style={{ ...btnStyle(activeEventId === e.id ? CI.cyan : '#ccc'), padding: '8px 16px', fontSize: 14 }}>
              {e.name}
            </button>
            <button onClick={() => deleteEvent(e.id)}
              style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 16, padding: 4 }}>×</button>
          </div>
        ))}
        <button style={btnStyle(`linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`)} onClick={() => setShowEventForm(true)}>
          ➕ กิจกรรมใหม่
        </button>
      </div>

      {/* New Event Form */}
      {showEventForm && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, color: CI.dark, marginTop: 0 }}>สร้างกิจกรรมใหม่</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input style={inputStyle} placeholder="ชื่อกิจกรรม" value={eventForm.name} onChange={e => setEventForm(f => ({ ...f, name: e.target.value }))} />
            <input style={inputStyle} type="date" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} />
            <input style={inputStyle} placeholder="สถานที่" value={eventForm.venue} onChange={e => setEventForm(f => ({ ...f, venue: e.target.value }))} />
            <input style={inputStyle} placeholder="รายละเอียด" value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btnStyle()} onClick={createEvent}>✅ สร้าง</button>
            <button style={btnStyle('#888')} onClick={() => setShowEventForm(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {activeEvent && (
        <>
          {/* Event Info */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: 18, color: CI.dark, margin: 0 }}>🎯 {activeEvent.name}</h3>
                <p style={{ color: '#888', fontSize: 14, margin: '4px 0' }}>
                  📅 {activeEvent.date || '-'} | 📍 {activeEvent.venue || '-'} | {activeEvent.description || ''}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: progress >= 80 ? '#4caf50' : progress >= 50 ? CI.gold : CI.magenta }}>{progress}%</div>
                <div style={{ fontSize: 12, color: '#888' }}>ความคืบหน้า</div>
              </div>
            </div>
            <div style={{ height: 8, background: '#eee', borderRadius: 8, marginTop: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${CI.cyan}, ${CI.purple})`, borderRadius: 8, transition: 'width 0.5s' }} />
            </div>
          </div>

          {/* Add Task */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <h4 style={{ fontSize: 16, color: CI.dark, marginTop: 0 }}>➕ เพิ่มงาน</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <input style={inputStyle} placeholder="ชื่องาน" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
              <input style={inputStyle} placeholder="ผู้รับผิดชอบ" value={taskForm.assignee} onChange={e => setTaskForm(f => ({ ...f, assignee: e.target.value }))} />
              <input style={inputStyle} type="date" value={taskForm.deadline} onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))} />
              <button style={btnStyle()} onClick={addTask}>เพิ่ม</button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#888' }}>กรอง:</span>
            {[{ key: 'all', label: 'ทั้งหมด', color: '#888' }, ...STATUS_LIST].map(s => (
              <button key={s.key} onClick={() => setFilterStatus(s.key)}
                style={{ ...btnStyle(filterStatus === s.key ? s.color : '#ddd'), padding: '6px 14px', fontSize: 13, color: filterStatus === s.key ? '#fff' : '#555' }}>
                {s.label}
              </button>
            ))}
            {allAssignees.length > 0 && (
              <select style={{ ...inputStyle, width: 'auto' }} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
                <option value="">ผู้รับผิดชอบทั้งหมด</option>
                {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
          </div>

          {/* Gantt-like Timeline */}
          {tasks.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 16, overflowX: 'auto' }}>
              <h4 style={{ fontSize: 16, color: CI.dark, marginTop: 0 }}>📊 Timeline</h4>
              {(() => {
                const { min, days } = getGanttRange();
                const dayWidth = Math.max(40, 600 / days);
                return (
                  <div style={{ position: 'relative', minWidth: days * dayWidth + 150 }}>
                    {filteredTasks.map((t, i) => {
                      const statusInfo = STATUS_LIST.find(s => s.key === t.status);
                      const taskDate = t.deadline ? new Date(t.deadline) : new Date();
                      const startDay = 0;
                      const endDay = Math.max(Math.round((taskDate - min) / 86400000), 1);
                      const barLeft = startDay * dayWidth;
                      const barWidth = Math.max(endDay * dayWidth, dayWidth);
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ width: 140, fontSize: 13, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.title}
                          </div>
                          <div style={{ flex: 1, position: 'relative', height: 24 }}>
                            <div style={{
                              position: 'absolute', left: barLeft, width: barWidth, height: 22,
                              background: statusInfo?.color || '#ccc', borderRadius: 6, opacity: 0.85,
                              display: 'flex', alignItems: 'center', paddingLeft: 8, fontSize: 11, color: '#fff', fontWeight: 600,
                            }}>
                              {t.assignee} {t.deadline ? `→ ${t.deadline}` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Task List */}
          <div style={cardStyle}>
            <h4 style={{ fontSize: 16, color: CI.dark, marginTop: 0 }}>📝 รายการงาน ({filteredTasks.length}/{tasks.length})</h4>
            {filteredTasks.length === 0 && <p style={{ color: '#aaa', fontSize: 14, textAlign: 'center', padding: 20 }}>ยังไม่มีงาน</p>}
            {filteredTasks.map(t => {
              const statusInfo = STATUS_LIST.find(s => s.key === t.status);
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 6, background: statusInfo?.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                    <div style={{ fontSize: 13, color: '#888' }}>👤 {t.assignee || '-'} | 📅 {t.deadline || '-'}</div>
                  </div>
                  <select style={{ ...inputStyle, width: 'auto', fontSize: 13 }} value={t.status}
                    onChange={e => updateTaskStatus(t.id, e.target.value)}>
                    {STATUS_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <button style={{ ...btnStyle('#e53935'), padding: '6px 12px', fontSize: 12 }} onClick={() => deleteTask(t.id)}>ลบ</button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
