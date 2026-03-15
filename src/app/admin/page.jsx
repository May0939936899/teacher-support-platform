import AdminDashboard from '@/components/AdminDashboard';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Admin Dashboard — BiZ Content',
};

export default function AdminPage() {
  return (
    <div className="app-container">
      <Navbar />
      <div style={{ paddingTop: '120px', maxWidth: '1200px', margin: '0 auto', padding: '120px 24px 80px' }}>
        <AdminDashboard />
      </div>
    </div>
  );
}
