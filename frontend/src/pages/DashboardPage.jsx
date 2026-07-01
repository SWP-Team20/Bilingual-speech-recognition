import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import UploadButton from '../components/UploadButton';
import AudioSearchBar from '../components/AudioSearchBar';
import ProfileDropdown from '../components/ProfileDropdown';
import TabButton from '../components/TabButton';
import AudioPanel from './AudioPanel';
import StatisticsPanel from './StatisticsPanel';
import AdminPanel from './AdminPanel';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useHeaderSearchWrap } from '../hooks/useHeaderSearchWrap';
import { MOBILE_BREAKPOINT } from '../theme';

function DashboardPage({ onLogout }) {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'audio');
  const [pendingUploads, setPendingUploads] = useState([]);
  const [uploadVersion, setUploadVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);
  const headerRef = useRef(null);
  const titleRef = useRef(null);
  const searchOnOwnRow = useHeaderSearchWrap({ headerRef, titleRef });
  const stackSearch = isNarrow || searchOnOwnRow;

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    userApi.fetchProfile()
      .then(data => {
        const role = data.role || 'user';
        setUserRole(role);
        if (activeTab === 'admin' && role !== 'admin') setActiveTab('audio');
      })
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
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f5f5f5', height: isNarrow ? 'auto' : '100vh', minHeight: '100vh', maxHeight: isNarrow ? 'none' : '100vh', padding: isNarrow ? '20px 0' : '40px 0', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: isNarrow ? 'auto' : 'hidden' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: isNarrow ? '0 16px' : '0 40px', flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minHeight: 0 }}>

        <div
          ref={headerRef}
          style={{
          display: 'grid',
          gridTemplateColumns: stackSearch ? '1fr auto' : 'auto 1fr auto',
          gridTemplateAreas: stackSearch
            ? '"title actions" "search search"'
            : '"title search actions"',
          gap: stackSearch ? '12px' : '24px',
          alignItems: 'center',
          marginBottom: stackSearch ? '20px' : '40px',
          width: '100%',
          flexShrink: 0,
        }}>
          <h1
            ref={titleRef}
            style={{
            gridArea: 'title',
            fontSize: isNarrow ? '20px' : '42px',
            fontWeight: 'bold',
            margin: 0,
            letterSpacing: '-0.5px',
            padding: 0,
            textAlign: 'left',
            lineHeight: 1.15,
            minWidth: 0,
            whiteSpace: stackSearch ? 'normal' : 'nowrap',
          }}>
            Bilingual Speech Recognition
          </h1>

          <AudioSearchBar
            onSearch={handleSearch}
            compact={stackSearch}
            style={{ gridArea: 'search', width: '100%', minWidth: 0 }}
          />

          <div
            style={{
              gridArea: 'actions',
              justifySelf: 'end',
              display: 'flex',
              alignItems: 'center',
              gap: stackSearch ? '12px' : '24px',
              flexShrink: 0,
            }}
          >
            <UploadButton
              onUploadStart={handleUploadStart}
              onUploadEnd={handleUploadEnd}
              userRole={userRole}
              style={{
                height: stackSearch ? '44px' : '48px',
                width: stackSearch ? 'auto' : '160px',
                padding: stackSearch ? '0 14px' : 0,
                fontSize: stackSearch ? '16px' : '18px',
                boxSizing: 'border-box',
              }}
            />
            <ProfileDropdown
              size={stackSearch ? 44 : 48}
              onLogout={onLogout}
              onNavigateToSecurity={() => navigate('/security')}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isAdmin ? '1fr 1fr 1fr' : '1fr 1fr',
          gap: isNarrow ? '10px' : '48px',
          marginBottom: '24px',
          flexShrink: 0,
          width: '100%',
        }}>
          <TabButton compact={isNarrow} active={activeTab === 'audio'} onClick={() => setActiveTab('audio')}>Аудиозаписи</TabButton>
          <TabButton compact={isNarrow} active={activeTab === 'statistics'} onClick={() => setActiveTab('statistics')}>Статистика</TabButton>
          {isAdmin && (
            <TabButton compact={isNarrow} active={activeTab === 'admin'} onClick={() => setActiveTab('admin')}>Админ-панель</TabButton>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'audio' && (
            <AudioPanel
              userRole={userRole}
              pendingUploads={pendingUploads}
              uploadVersion={uploadVersion}
              searchQuery={searchQuery}
            />
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
