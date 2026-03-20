'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const STORAGE_KEY = 'teacher_ta_coordinator';
const STATUSES = ['pending', 'in-progress', 'done'];
const STATUS_LABELS = { pending: '⏳ รอดำเนินการ', 'in-progress': '🔄 กำลังทำ', done: '✅ เสร็จสิ้น' };
const STATUS_COLORS = { pending: CI.gold, 'in-progress': CI.cyan, done: '#4caf50' };

export default function TACoordinator() {
  const [tas, setTas] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTA, setNewTA] = useState({ name: '', hoursPerWeek: 10 });
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee: '', estimatedHours: 1, priority: 'medium' });
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setTas(data.tas || []);
      setTasks(data.tasks || []);
    }
  }, []);

  const saveData = (t, tk) => {
    setTas(t); setTasks(tk);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tas: t, tasks: tk }));
  };

  const addTA = () => {
    if (!newTA.name.trim()) { toast.error('กรุณากรอกชื่อ TA'); return; }
    const updated = [...tas, { id: Date.now().toString(), name: newTA.name.trim(), hoursPerWeek: Number(newTA.hoursPerWeek) || 10 }];
    saveData(updated, tasks);
    setNewTA({ name: '', hoursPerWeek: 10 });
    toast.success('เพิ่ม TA แล้ว');
  };

  const removeTA = (id) => {
    const updated = tas.filter(t => t.id !== id);
    const updatedTasks = tasks.map(t => t.assignee === id ? { ...t, assignee: '' } : t);
    saveData(updated, updatedTasks);
    toast.success('ลบ TA แล้ว');
  };

  const addTask = () => {
    if (!newTask.title.trim()) { toast.error('กรุณากรอกชื่องาน'); return; }
    const task = {
      id: Date.now().toString(),
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      assignee: newTask.assignee,
      estimatedHours: Number(newTask.estimatedHours) || 1,
      priority: newTask.priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const updated = [...tasks, task];
    saveData(tas, updated);
    setNewTask({ title: '', description: '', assignee: '', estimatedHours: 1, priority: 'medium' });
    setShowAddTask(false);
    toast.success('เพิ่มงานแล้ว');
  };

  const updateTaskStatus = (taskId, newStatus) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    saveData(tas, updated);
  };

  const removeTask = (taskId) => {
    saveData(tas, tasks.filter(t => t.id !== taskId));
    toast.success('ลบงานแล้ว');
  };

  const getTasksForTA = (taId) => tasks.filter(t => t.assignee === taId);
  const getHoursForTA = (taId) => getTasksForTA(taId).reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  const btnStyle = {
    padding: '10px 24px', border: 'none', borderRadius: 12,
    background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
    color: '#fff', fontFamily: FONT, fontSize: 16, cursor: 'pointer', fontWeight: 600,
  };

  const inputStyle = {
    padding: '10px 14px', border: `2px solid ${CI.cyan}33`, borderRadius: 10,
    background: '#16163a', color: '#fff', fontFamily: FONT, fontSize: 15, outline: 'none', width: '100%',
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)', borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)', padding: 20, marginBottom: 16,
  };

  const priorityColors = { high: '#f44336', medium: CI.gold, low: '#4caf50' };

  const TaskCard = ({ task }) => {
    const ta = tas.find(t => t.id === task.assignee);
    return (
      <div style={{
        background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, marginBottom: 10,
        borderLeft: `4px solid ${priorityColors[task.priority] || CI.cyan}`,
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{task.title}</div>
        {task.description && <div style={{ fontSize: 14, color: '#aaa', marginBottom: 8 }}>{task.description}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, background: `${priorityColors[task.priority]}22`, color: priorityColors[task.priority], padding: '2px 8px', borderRadius: 6 }}>
              {task.priority === 'high' ? '🔴 สูง' : task.priority === 'medium' ? '🟡 ปานกลาง' : '🟢 ต่ำ'}
            </span>
            <span style={{ fontSize: 13, color: '#aaa' }}>⏱ {task.estimatedHours}h</span>
            {ta && <span style={{ fontSize: 13, color: CI.cyan }}>👤 {ta.name}</span>}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUSES.filter(s => s !== task.status).map(s => (
              <button key={s} onClick={() => updateTaskStatus(task.id, s)}
                style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, border: 'none', background: `${STATUS_COLORS[s]}22`, color: STATUS_COLORS[s], cursor: 'pointer', fontFamily: FONT }}>
                → {STATUS_LABELS[s].split(' ')[1]}
              </button>
            ))}
            <button onClick={() => removeTask(task.id)}
              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, border: 'none', background: 'rgba(244,67,54,0.15)', color: '#f44', cursor: 'pointer', fontFamily: FONT }}>
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: FONT, color: '#fff', minHeight: '100vh', padding: '24px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, margin: 0, background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🎓 TA Coordinator
          </h2>
          <p style={{ fontSize: 15, color: '#aaa', marginTop: 6 }}>จัดการและมอบหมายงานให้ผู้ช่วยสอน</p>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'TA ทั้งหมด', value: tas.length, color: CI.cyan },
            { label: 'งานทั้งหมด', value: tasks.length, color: CI.magenta },
            { label: 'เสร็จแล้ว', value: completedTasks, color: '#4caf50' },
            { label: 'ชั่วโมงรวม', value: `${totalHours}h`, color: CI.gold },
          ].map((s, i) => (
            <div key={i} style={{ background: `${s.color}11`, borderRadius: 12, padding: 14, textAlign: 'center', border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 14, color: '#aaa', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add TA */}
        <div style={{ ...cardStyle, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 4 }}>ชื่อ TA</label>
            <input style={inputStyle} placeholder="ชื่อผู้ช่วยสอน" value={newTA.name} onChange={e => setNewTA({ ...newTA, name: e.target.value })} />
          </div>
          <div style={{ width: 120 }}>
            <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 4 }}>ชม./สัปดาห์</label>
            <input type="number" style={inputStyle} value={newTA.hoursPerWeek} onChange={e => setNewTA({ ...newTA, hoursPerWeek: e.target.value })} />
          </div>
          <button onClick={addTA} style={btnStyle}>+ เพิ่ม TA</button>
          <button onClick={() => setShowAddTask(!showAddTask)} style={{ ...btnStyle, background: CI.purple }}>+ เพิ่มงาน</button>
        </div>

        {/* TA List */}
        {tas.length > 0 && (
          <div style={{ ...cardStyle }}>
            <h4 style={{ fontSize: 17, color: CI.cyan, marginBottom: 12 }}>👥 รายชื่อ TA</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {tas.map(ta => {
                const hours = getHoursForTA(ta.id);
                const pct = ta.hoursPerWeek > 0 ? Math.min(100, (hours / ta.hoursPerWeek) * 100) : 0;
                return (
                  <div key={ta.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', minWidth: 180, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{ta.name}</span>
                      <button onClick={() => removeTA(ta.id)} style={{ background: 'none', border: 'none', color: '#f44', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                    <div style={{ fontSize: 14, color: '#aaa', marginTop: 4 }}>งาน: {getTasksForTA(ta.id).length} | {hours}/{ta.hoursPerWeek}h</div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct > 90 ? '#f44336' : pct > 60 ? CI.gold : '#4caf50', borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Task Form */}
        {showAddTask && (
          <div style={{ ...cardStyle, border: `1px solid ${CI.purple}44` }}>
            <h4 style={{ fontSize: 17, color: CI.purple, marginBottom: 12 }}>📝 เพิ่มงานใหม่</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 4 }}>ชื่องาน *</label>
                <input style={inputStyle} placeholder="ชื่องาน" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 4 }}>มอบหมายให้</label>
                <select style={inputStyle} value={newTask.assignee} onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}>
                  <option value="">-- ยังไม่ระบุ --</option>
                  {tas.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 4 }}>ชั่วโมงประมาณ</label>
                <input type="number" style={inputStyle} value={newTask.estimatedHours} onChange={e => setNewTask({ ...newTask, estimatedHours: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 4 }}>ความสำคัญ</label>
                <select style={inputStyle} value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                  <option value="high">🔴 สูง</option>
                  <option value="medium">🟡 ปานกลาง</option>
                  <option value="low">🟢 ต่ำ</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 4 }}>รายละเอียด</label>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="รายละเอียดงาน" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={addTask} style={btnStyle}>สร้างงาน</button>
              <button onClick={() => setShowAddTask(false)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)' }}>ยกเลิก</button>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {STATUSES.map(status => (
            <div key={status} style={{ ...cardStyle, borderTop: `3px solid ${STATUS_COLORS[status]}` }}>
              <h4 style={{ fontSize: 16, color: STATUS_COLORS[status], marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                {STATUS_LABELS[status]}
                <span style={{ background: `${STATUS_COLORS[status]}22`, borderRadius: 10, padding: '2px 10px', fontSize: 14 }}>
                  {tasks.filter(t => t.status === status).length}
                </span>
              </h4>
              {tasks.filter(t => t.status === status).map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <p style={{ fontSize: 14, color: '#555', textAlign: 'center', padding: 20 }}>ไม่มีงาน</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}