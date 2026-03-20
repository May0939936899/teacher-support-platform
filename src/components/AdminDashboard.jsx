'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Users, Target, Sparkles, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { CATEGORIES, PLATFORMS } from '@/lib/constants';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, getAccessToken } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', platform: '', category: '' });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin, filters]);

  async function fetchStats() {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const params = new URLSearchParams();
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.platform) params.set('platform', filters.platform);
      if (filters.category) params.set('category', filters.category);

      const res = await fetch(`/api/admin/stats?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="dashboard-header-page">
        <h2><BarChart3 size={24} style={{ color: 'var(--primary)' }} /> SPUBUS BIZ CONTENT | Admin Dashboard</h2>
        <button onClick={() => router.push('/')} className="back-btn">← กลับหน้าหลัก</button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>จาก:</label>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        </div>
        <div className="filter-group">
          <label>ถึง:</label>
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        </div>
        <div className="filter-group">
          <label>แพลตฟอร์ม:</label>
          <select value={filters.platform} onChange={(e) => setFilters({ ...filters, platform: e.target.value })}>
            <option value="">ทั้งหมด</option>
            {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>หมวดหมู่:</label>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">ทั้งหมด</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading || !stats ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} className="spinner" />
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="dashboard-metrics">
            <div className="metric-card">
              <div className="metric-icon"><Users size={24} /></div>
              <div className="metric-info">
                <span className="metric-label">จำนวนการใช้งานทั้งหมด</span>
                <span className="metric-value">{stats.totalGenerations}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Target size={24} /></div>
              <div className="metric-info">
                <span className="metric-label">แพลตฟอร์มยอดฮิต</span>
                <span className="metric-value">{stats.topPlatform}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Sparkles size={24} /></div>
              <div className="metric-info">
                <span className="metric-label">หมวดหมู่ยอดฮิต</span>
                <span className="metric-value" style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                  {stats.topCategory}
                </span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Users size={24} /></div>
              <div className="metric-info">
                <span className="metric-label">ผู้ใช้ที่ลงทะเบียน</span>
                <span className="metric-value">{stats.activeUsers}</span>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="dashboard-table-container">
            <h3>บันทึกการใช้งานล่าสุด (Recent Logs)</h3>
            <p className="table-subtitle">*ระบบไม่ได้จัดเก็บข้อความดิบเพื่อรักษา Privacy ของผู้ใช้</p>
            {stats.recentLogs.length === 0 ? (
              <div className="empty-logs">ยังไม่มีประวัติการใช้งานระบบ</div>
            ) : (
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>วัน-เวลา</th>
                    <th>แพลตฟอร์ม</th>
                    <th>ประเภท/สาขา</th>
                    <th>โทนเสียง</th>
                    <th>หัวข้อ</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLogs.map(stat => (
                    <tr key={stat.id}>
                      <td>{new Date(stat.created_at).toLocaleString('th-TH')}</td>
                      <td><span className={`platform-badge ${stat.platform}`}>{stat.platform}</span></td>
                      <td className="truncate-td">{stat.category}</td>
                      <td>{stat.tone}</td>
                      <td className="truncate-td">{stat.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
