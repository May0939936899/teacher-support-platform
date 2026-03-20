'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const STORAGE_KEY = 'teacher_student_progress';

export default function StudentProgress() {
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState({});
  const [newStudent, setNewStudent] = useState({ name: '', studentId: '' });
  const [newAssignment, setNewAssignment] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [view, setView] = useState('table'); // table | individual | chart

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setStudents(data.students || []);
      setAssignments(data.assignments || []);
      setGrades(data.grades || {});
    }
  }, []);

  const saveData = (s, a, g) => {
    setStudents(s);
    setAssignments(a);
    setGrades(g);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ students: s, assignments: a, grades: g }));
  };

  const addStudent = () => {
    if (!newStudent.name || !newStudent.studentId) { toast.error('กรุณากรอกชื่อและรหัสนักศึกษา'); return; }
    if (students.find(s => s.studentId === newStudent.studentId)) { toast.error('รหัสนักศึกษาซ้ำ'); return; }
    const updated = [...students, { ...newStudent, id: Date.now().toString() }];
    saveData(updated, assignments, grades);
    setNewStudent({ name: '', studentId: '' });
    toast.success('เพิ่มนักศึกษาแล้ว');
  };

  const removeStudent = (id) => {
    const updated = students.filter(s => s.id !== id);
    const newGrades = { ...grades };
    delete newGrades[id];
    saveData(updated, assignments, newGrades);
    if (selectedStudent === id) setSelectedStudent(null);
    toast.success('ลบนักศึกษาแล้ว');
  };

  const addAssignment = () => {
    if (!newAssignment.trim()) { toast.error('กรุณากรอกชื่องาน'); return; }
    const updated = [...assignments, { id: Date.now().toString(), name: newAssignment.trim() }];
    saveData(students, updated, grades);
    setNewAssignment('');
    toast.success('เพิ่มงานแล้ว');
  };

  const removeAssignment = (aId) => {
    const updated = assignments.filter(a => a.id !== aId);
    const newGrades = { ...grades };
    Object.keys(newGrades).forEach(sId => {
      if (newGrades[sId]) delete newGrades[sId][aId];
    });
    saveData(students, updated, newGrades);
    toast.success('ลบงานแล้ว');
  };

  const updateGrade = (studentId, assignmentId, value) => {
    const val = value === '' ? '' : Math.min(100, Math.max(0, Number(value)));
    const newGrades = { ...grades, [studentId]: { ...(grades[studentId] || {}), [assignmentId]: val } };
    saveData(students, assignments, newGrades);
  };

  const getStudentAvg = (sId) => {
    const sg = grades[sId] || {};
    const vals = assignments.map(a => sg[a.id]).filter(v => v !== undefined && v !== '');
    if (vals.length === 0) return null;
    return (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(1);
  };

  const getAssignmentAvg = (aId) => {
    const vals = students.map(s => (grades[s.id] || {})[aId]).filter(v => v !== undefined && v !== '');
    if (vals.length === 0) return null;
    return (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(1);
  };

  const getLetterGrade = (score) => {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const exportCSV = () => {
    if (students.length === 0) { toast.error('ไม่มีข้อมูลให้ export'); return; }
    let csv = 'รหัสนักศึกษา,ชื่อ,' + assignments.map(a => a.name).join(',') + ',เฉลี่ย\n';
    students.forEach(s => {
      const sg = grades[s.id] || {};
      const avg = getStudentAvg(s.id);
      csv += `${s.studentId},${s.name},${assignments.map(a => sg[a.id] ?? '').join(',')},${avg ?? ''}\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_progress_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV สำเร็จ');
  };

  const selectedStudentData = selectedStudent ? students.find(s => s.id === selectedStudent) : null;

  const btnStyle = {
    padding: '10px 24px',
    border: 'none',
    borderRadius: 12,
    background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
    color: '#fff',
    fontFamily: FONT,
    fontSize: 16,
    cursor: 'pointer',
    fontWeight: 600,
  };

  const inputStyle = {
    padding: '10px 14px',
    border: `2px solid ${CI.cyan}33`,
    borderRadius: 10,
    background: '#16163a',
    color: '#fff',
    fontFamily: FONT,
    fontSize: 15,
    outline: 'none',
    width: '100%',
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: 20,
    marginBottom: 16,
  };

  return (
    <div style={{ fontFamily: FONT, color: '#fff', minHeight: '100vh', padding: '24px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, margin: 0, background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            📊 Student Progress Tracker
          </h2>
          <p style={{ fontSize: 15, color: '#aaa', marginTop: 6 }}>ติดตามผลการเรียนนักศึกษาแบบครบวงจร</p>
        </div>

        {/* View tabs */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {[{ key: 'table', label: '📋 ตารางคะแนน' }, { key: 'individual', label: '👤 รายบุคคล' }, { key: 'chart', label: '📊 กราฟเฉลี่ย' }].map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              style={{ ...btnStyle, fontSize: 15, padding: '8px 18px', background: view === v.key ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})` : 'rgba(255,255,255,0.08)', color: view === v.key ? '#fff' : '#aaa' }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Add Student & Assignment */}
        <div style={{ ...cardStyle, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ fontSize: 14, color: '#aaa', marginBottom: 4, display: 'block' }}>ชื่อนักศึกษา</label>
            <input style={inputStyle} placeholder="ชื่อ-นามสกุล" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 14, color: '#aaa', marginBottom: 4, display: 'block' }}>รหัสนักศึกษา</label>
            <input style={inputStyle} placeholder="6XXXXXXXX" value={newStudent.studentId} onChange={e => setNewStudent({ ...newStudent, studentId: e.target.value })} />
          </div>
          <button onClick={addStudent} style={btnStyle}>+ เพิ่มนักศึกษา</button>
          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 14, color: '#aaa', marginBottom: 4, display: 'block' }}>ชื่องาน/Assignment</label>
            <input style={inputStyle} placeholder="เช่น Quiz 1, Midterm" value={newAssignment} onChange={e => setNewAssignment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAssignment()} />
          </div>
          <button onClick={addAssignment} style={btnStyle}>+ เพิ่มงาน</button>
          <button onClick={exportCSV} style={{ ...btnStyle, background: CI.gold, color: CI.dark }}>⬇ Export CSV</button>
        </div>

        {/* Table View */}
        {view === 'table' && (
          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            {students.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', fontSize: 16, padding: 40 }}>ยังไม่มีนักศึกษา — เพิ่มด้านบนเพื่อเริ่มต้น</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${CI.cyan}44` }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: CI.cyan, fontSize: 15 }}>รหัส</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: CI.cyan, fontSize: 15 }}>ชื่อ</th>
                    {assignments.map(a => (
                      <th key={a.id} style={{ padding: '10px 8px', textAlign: 'center', color: CI.gold, fontSize: 14, minWidth: 80 }}>
                        {a.name}
                        <button onClick={() => removeAssignment(a.id)} style={{ background: 'none', border: 'none', color: '#f44', cursor: 'pointer', fontSize: 12, marginLeft: 4 }}>✕</button>
                      </th>
                    ))}
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: CI.magenta, fontSize: 15 }}>เฉลี่ย</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 15 }}>เกรด</th>
                    <th style={{ padding: '10px 8px', fontSize: 15 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const avg = getStudentAvg(s.id);
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '8px', fontSize: 15 }}>{s.studentId}</td>
                        <td style={{ padding: '8px', fontSize: 15 }}>
                          <span style={{ cursor: 'pointer', color: CI.cyan, textDecoration: 'underline' }} onClick={() => { setSelectedStudent(s.id); setView('individual'); }}>
                            {s.name}
                          </span>
                        </td>
                        {assignments.map(a => (
                          <td key={a.id} style={{ padding: '4px 6px', textAlign: 'center' }}>
                            <input
                              type="number" min="0" max="100"
                              value={(grades[s.id] || {})[a.id] ?? ''}
                              onChange={e => updateGrade(s.id, a.id, e.target.value)}
                              style={{ ...inputStyle, width: 60, textAlign: 'center', padding: '6px 4px', fontSize: 15 }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, fontSize: 16, color: avg !== null ? (avg >= 80 ? '#4caf50' : avg >= 50 ? CI.gold : '#f44336') : '#666' }}>
                          {avg ?? '-'}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, fontSize: 16, color: avg !== null ? (avg >= 80 ? '#4caf50' : avg >= 50 ? CI.gold : '#f44336') : '#666' }}>
                          {avg !== null ? getLetterGrade(Number(avg)) : '-'}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <button onClick={() => removeStudent(s.id)} style={{ background: 'rgba(244,67,54,0.15)', border: '1px solid #f4433644', color: '#f44', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }}>ลบ</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {assignments.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${CI.magenta}44` }}>
                      <td colSpan={2} style={{ padding: '10px 8px', fontWeight: 700, color: CI.magenta, fontSize: 15 }}>เฉลี่ยรายงาน</td>
                      {assignments.map(a => (
                        <td key={a.id} style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: CI.gold, fontSize: 15 }}>
                          {getAssignmentAvg(a.id) ?? '-'}
                        </td>
                      ))}
                      <td colSpan={2}></td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        )}

        {/* Individual View */}
        {view === 'individual' && (
          <div style={cardStyle}>
            {!selectedStudentData ? (
              <div>
                <p style={{ fontSize: 16, color: '#aaa', marginBottom: 12 }}>เลือกนักศึกษาเพื่อดูผลการเรียน:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {students.map(s => (
                    <button key={s.id} onClick={() => setSelectedStudent(s.id)}
                      style={{ ...btnStyle, fontSize: 15, padding: '8px 16px', background: 'rgba(255,255,255,0.08)' }}>
                      {s.studentId} — {s.name}
                    </button>
                  ))}
                </div>
                {students.length === 0 && <p style={{ color: '#666', fontSize: 15, marginTop: 12 }}>ยังไม่มีนักศึกษา</p>}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 20, margin: 0, color: CI.cyan }}>{selectedStudentData.name}</h3>
                    <p style={{ fontSize: 15, color: '#aaa', margin: '4px 0 0' }}>รหัส: {selectedStudentData.studentId}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSelectedStudent(null)} style={{ ...btnStyle, fontSize: 14, padding: '6px 14px', background: 'rgba(255,255,255,0.1)' }}>← กลับ</button>
                  </div>
                </div>

                {/* Student Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {(() => {
                    const avg = getStudentAvg(selectedStudent);
                    const sg = grades[selectedStudent] || {};
                    const graded = assignments.filter(a => sg[a.id] !== undefined && sg[a.id] !== '');
                    const highest = graded.length > 0 ? Math.max(...graded.map(a => Number(sg[a.id]))) : null;
                    const lowest = graded.length > 0 ? Math.min(...graded.map(a => Number(sg[a.id]))) : null;
                    return [
                      { label: 'เฉลี่ย', value: avg ?? '-', color: CI.cyan },
                      { label: 'เกรด', value: avg ? getLetterGrade(Number(avg)) : '-', color: CI.magenta },
                      { label: 'สูงสุด', value: highest ?? '-', color: '#4caf50' },
                      { label: 'ต่ำสุด', value: lowest ?? '-', color: CI.gold },
                      { label: 'งานที่ส่ง', value: `${graded.length}/${assignments.length}`, color: CI.purple },
                    ].map((stat, i) => (
                      <div key={i} style={{ background: `${stat.color}11`, borderRadius: 12, padding: 14, textAlign: 'center', border: `1px solid ${stat.color}33` }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 14, color: '#aaa', marginTop: 4 }}>{stat.label}</div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Grade Trend Chart */}
                <h4 style={{ fontSize: 17, color: '#fff', marginBottom: 12 }}>📈 แนวโน้มคะแนน</h4>
                {assignments.length === 0 ? (
                  <p style={{ color: '#888', fontSize: 15 }}>ยังไม่มีงานที่กำหนด</p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 200, padding: '0 10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {assignments.map(a => {
                      const score = (grades[selectedStudent] || {})[a.id];
                      const hasScore = score !== undefined && score !== '';
                      const h = hasScore ? (Number(score) / 100) * 180 : 0;
                      const color = hasScore ? (score >= 80 ? '#4caf50' : score >= 50 ? CI.gold : '#f44336') : '#333';
                      return (
                        <div key={a.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {hasScore && <span style={{ fontSize: 14, color: '#fff', marginBottom: 4 }}>{score}</span>}
                          <div style={{ width: '100%', maxWidth: 48, height: h, background: `linear-gradient(180deg, ${color}, ${color}88)`, borderRadius: '6px 6px 0 0', transition: 'height 0.3s' }} />
                          <span style={{ fontSize: 12, color: '#aaa', marginTop: 6, textAlign: 'center', wordBreak: 'break-all' }}>{a.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Class Average Chart */}
        {view === 'chart' && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: 18, color: CI.cyan, marginBottom: 16 }}>📊 เฉลี่ยคะแนนรวมของชั้นเรียน (แต่ละงาน)</h3>
            {assignments.length === 0 ? (
              <p style={{ color: '#888', fontSize: 15, textAlign: 'center', padding: 40 }}>ยังไม่มีงานที่กำหนด</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {assignments.map(a => {
                  const avg = getAssignmentAvg(a.id);
                  const w = avg ? `${avg}%` : '0%';
                  const color = avg ? (avg >= 80 ? '#4caf50' : avg >= 50 ? CI.gold : '#f44336') : '#333';
                  return (
                    <div key={a.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 4 }}>
                        <span>{a.name}</span>
                        <span style={{ color, fontWeight: 700 }}>{avg ?? 'N/A'}</span>
                      </div>
                      <div style={{ height: 28, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: w, background: `linear-gradient(90deg, ${CI.cyan}, ${color})`, borderRadius: 8, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Per-student averages */}
            <h3 style={{ fontSize: 18, color: CI.magenta, margin: '28px 0 16px' }}>👥 เฉลี่ยรายบุคคล</h3>
            {students.length === 0 ? (
              <p style={{ color: '#888', fontSize: 15, textAlign: 'center' }}>ยังไม่มีนักศึกษา</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 220, padding: '0 10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {students.map(s => {
                  const avg = getStudentAvg(s.id);
                  const hasAvg = avg !== null;
                  const h = hasAvg ? (Number(avg) / 100) * 200 : 0;
                  const color = hasAvg ? (avg >= 80 ? '#4caf50' : avg >= 50 ? CI.gold : '#f44336') : '#333';
                  return (
                    <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 60 }}>
                      {hasAvg && <span style={{ fontSize: 14, color: '#fff', marginBottom: 4, fontWeight: 600 }}>{avg}</span>}
                      <div style={{ width: '100%', height: h, background: `linear-gradient(180deg, ${color}, ${color}66)`, borderRadius: '6px 6px 0 0', transition: 'height 0.3s' }} />
                      <span style={{ fontSize: 12, color: '#aaa', marginTop: 6, textAlign: 'center', wordBreak: 'break-all' }}>{s.name.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}