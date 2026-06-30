import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import UploadButton from '../components/UploadButton';
import ProfileDropdown from '../components/ProfileDropdown';
import TabButton from '../components/TabButton';
import AudioPanel from './AudioPanel';
import StatisticsPanel from './StatisticsPanel';
import AdminPanel from './AdminPanel';

function DashboardPage({ onLogout }) {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('audio');
  const [pendingUploads, setPendingUploads] = useState([]);
  const [uploadVersion, setUploadVersion] = useState(0);

  useEffect(() => {
    userApi.fetchProfile()
      .then(data => setUserRole(data.role || 'user'))
      .catch(error => console.error("Ошибка загрузки данных пользователя:", error));
  }, []);

  const handleUploadStart = (fileName, tempId) => {
    setPendingUploads(prev => [{ id: tempId, name: fileName, isPending: true }, ...prev]);
  };

  const handleUploadEnd = (tempId, isSuccess) => {
    setPendingUploads(prev => prev.filter(item => item.id !== tempId));
    if (isSuccess) setUploadVersion(v => v + 1);
  };

  const isAdmin = userRole === 'admin';

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f5f5f5', height: '100vh', maxHeight: '100vh', padding: '40px 0', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '0 40px', flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minHeight: 0 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: '24px', marginBottom: '40px', width: '100%', flexShrink: 0 }}>
          <h1 style={{ fontSize: '42px', fontWeight: 'bold', margin: 0, letterSpacing: '-0.5px', padding: 0, textAlign: 'left' }}>
            Bilingual Speech Recognition
          </h1>

          <UploadButton
            onUploadStart={handleUploadStart}
            onUploadEnd={handleUploadEnd}
            userRole={userRole}
            style={{ height: '48px', boxSizing: 'border-box' }}
          />

          <ProfileDropdown onLogout={onLogout} onNavigateToSecurity={() => navigate('/security')} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr 1fr' : '1fr 1fr', gap: '48px', marginBottom: '24px', flexShrink: 0, width: '100%' }}>
          <TabButton active={activeTab === 'audio'} onClick={() => setActiveTab('audio')}>Аудиозаписи</TabButton>
          <TabButton active={activeTab === 'statistics'} onClick={() => setActiveTab('statistics')}>Статистика</TabButton>
          {isAdmin && (
            <TabButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')}>Админ-панель</TabButton>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'audio' && (
            <AudioPanel userRole={userRole} pendingUploads={pendingUploads} uploadVersion={uploadVersion} />
          )}
          {activeTab === 'statistics' && <StatisticsPanel />}
          {activeTab === 'admin' && isAdmin && (
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <AdminPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
