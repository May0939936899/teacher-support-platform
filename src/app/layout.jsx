import '@/app/globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'BiZ Content — AI-Powered Content Generator',
  description: 'สร้างคอนเทนต์ด้วย AI สำหรับคณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#333', color: '#fff', fontSize: '14px', borderRadius: '10px' },
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
