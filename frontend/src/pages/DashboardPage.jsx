import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import UploadButton from '../components/UploadButton';
import AudioSearchBar from '../components/AudioSearchBar';
import ProfileDropdown from '../components/ProfileDropdown';
import TabButton from '../components/TabButton';
import AudioPanel from './AudioPanel';
import StatisticsPanel from './StatisticsPanel';
import AdminPanel from './AdminPanel';
import { canManageCorpus } from '../constants/roleTranslations';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MOBILE_BREAKPOINT } from '../theme';

function DashboardPage({ onLogout }) {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'audio');
  const [pendingUploads, setPendingUploads] = useState([]);
  const [uploadVersion, setUploadVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusAudioId, setFocusAudioId] = useState(null);
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);
  const canManage = canManageCorpus(userRole);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleSelectSearchResult = useCallback((audio) => {
    if (!audio?.id) return;
    setSearchQuery(audio.filename || '');
    setFocusAudioId(audio.id);
    setActiveTab('audio');
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
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gridTemplateAreas: '"title search actions"',
            gap: isNarrow ? '12px' : '24px',
            alignItems: 'center',
            marginBottom: isNarrow ? '20px' : '40px',
            width: '100%',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              gridArea: 'title',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <img
              src="/favicon.svg"
              alt="Bilingual Speech Recognition"
              style={{
                display: 'block',
                height: isNarrow ? '44px' : '48px',
                width: 'auto',
              }}
            />
          </div>

          <AudioSearchBar
            onSearch={handleSearch}
            onSelectResult={handleSelectSearchResult}
            showSuggestions={activeTab !== 'audio'}
            compact={isNarrow}
            style={{ gridArea: 'search', width: '100%', minWidth: 0 }}
          />

          <div
            style={{
              gridArea: 'actions',
              justifySelf: 'end',
              display: 'flex',
              alignItems: 'center',
              gap: isNarrow ? '12px' : '24px',
              flexShrink: 0,
            }}
          >
            {canManage && (
              <UploadButton
                onUploadStart={handleUploadStart}
                onUploadEnd={handleUploadEnd}
                userRole={userRole}
                style={{
                  height: isNarrow ? '44px' : '48px',
                  width: isNarrow ? 'auto' : '160px',
                  padding: isNarrow ? '0 14px' : 0,
                  fontSize: isNarrow ? '16px' : '18px',
                  boxSizing: 'border-box',
                }}
              />
            )}
            <ProfileDropdown
              size={isNarrow ? 44 : 48}
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
              focusAudioId={focusAudioId}
              onFocusAudioHandled={() => setFocusAudioId(null)}
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
