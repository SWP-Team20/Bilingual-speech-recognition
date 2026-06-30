import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioApi } from '../api/audioApi';
import { userApi } from '../api/userApi';
import UploadButton from '../components/UploadButton';
import AudioPlayer from '../components/AudioPlayer';
import TranscriptionBox from '../components/TranscriptionBox';
import ProfileDropdown from '../components/ProfileDropdown';
import AdminPanel from '../components/AdminPanel'; // Импортируем новый компонент

function DashboardPage({ onLogout }) {
  const navigate = useNavigate();
  const [audioList, setAudioList] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState(null);
  const [selectedTranscription, setSelectedTranscription] = useState('');
  const [selectedTranscriptionWords, setSelectedTranscriptionWords] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Текущая активная вкладка: 'audio', 'statistics', или 'admin'
  const [activeTab, setActiveTab] = useState('audio');

  useEffect(() => {
    loadAudioList();
    loadUserProfile();
  }, []);

  const loadAudioList = async () => {
    try {
      const data = await audioApi.fetchAudioList();
      setAudioList(data);
    } catch (error) {
      console.error("Ошибка загрузки аудио:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const data = await userApi.fetchProfile();
      setUserRole(data.role || 'user');
    } catch (error) {
      console.error("Ошибка загрузки данных пользователя:", error);
    }
  };

  const handleUploadStart = (fileName, tempId) => {
    setPendingUploads(prev => [{ id: tempId, name: fileName, isPending: true }, ...prev]);
  };

  const handleUploadEnd = (tempId, isSuccess) => {
    setPendingUploads(prev => prev.filter(item => item.id !== tempId));
    if (isSuccess) loadAudioList();
  };

  const handleDeleteSuccess = () => {
    setSelectedAudioId(null);
    setSelectedTranscription('');
    setSelectedTranscriptionWords([]);
    loadAudioList();
  };

  const handleTranscribeClick = async (audioId) => {
    if (selectedAudioId === audioId) {
      setSelectedAudioId(null);
      setSelectedTranscription('');
      setSelectedTranscriptionWords([]);
    } else {
      setSelectedAudioId(audioId);
      setIsTranscribing(true);
      try {
        const data = await audioApi.fetchTranscription(audioId);
        setSelectedTranscription(data.transcription_text || 'Транскрипция не найдена.');
        setSelectedTranscriptionWords(data.words || []);
      } catch (error) {
        console.error(error);
        setSelectedTranscription('Ошибка загрузки транскрипции');
        setSelectedTranscriptionWords([]);
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  const selectedAudioIndex = audioList.findIndex(a => a.id === selectedAudioId);
  const currentAudioName = selectedAudioIndex !== -1 ? `Аудио ${selectedAudioIndex + 1}` : '';
  const combinedAudioList = [...pendingUploads, ...audioList];

  const isAdmin = userRole === 'admin';

  // Базовые стили для кнопок-вкладок навигации
  const tabStyle = {
    borderRadius: '6px',
    padding: '14px',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
    fontFamily: 'inherit',
    border: 'none',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f5f5f5', height: '100vh', maxHeight: '100vh', padding: '40px 0', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '0 40px', flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minHeight: 0 }}>

        {/* TOP BAR */}
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

        {/* NAVIGATION PANEL (TABS) */}
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr 1fr' : '1fr 1fr', gap: '48px', marginBottom: '24px', flexShrink: 0, width: '100%' }}>
          
          {/* Вкладка: Аудиозаписи */}
          <button 
            onClick={() => setActiveTab('audio')}
            style={{ 
              ...tabStyle, 
              backgroundColor: activeTab === 'audio' ? '#522504' : '#e0e0e0', 
              color: activeTab === 'audio' ? '#fff' : '#616161'
            }}
          >
            Аудиозаписи
          </button>

          {/* Вкладка: Статистика */}
          <button 
            onClick={() => setActiveTab('statistics')}
            style={{ 
              ...tabStyle, 
              backgroundColor: activeTab === 'statistics' ? '#522504' : '#e0e0e0', 
              color: activeTab === 'statistics' ? '#fff' : '#616161'
            }}
          >
            Статистика
          </button>

          {/* Вкладка: Админ-панель (только для admin) */}
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('admin')}
              style={{ 
                ...tabStyle, 
                backgroundColor: activeTab === 'admin' ? '#522504' : '#e0e0e0', 
                color: activeTab === 'admin' ? '#fff' : '#616161'
              }}
            >
              Админ-панель
            </button>
          )}
        </div>

        {/* MAIN CONTENT AREA */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          
          {/* VIEW 1: AUDIO & TRANSCRIPTION */}
          {activeTab === 'audio' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', height: '100%', minHeight: 0 }}>
              {/* LEFT: Audio Streams List */}
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', alignItems: 'stretch' }}>
                <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
                  <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>Аудиозаписи</h2>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', boxSizing: 'border-box', width: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                    {combinedAudioList.map((audio, index) => (
                      <AudioPlayer
                        key={audio.id}
                        audio={audio}
                        index={audio.isPending ? null : index - pendingUploads.length}
                        isSelected={selectedAudioId === audio.id}
                        onTranscribeToggle={handleTranscribeClick}
                        onDeleteSuccess={handleDeleteSuccess}
                        userRole={userRole}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: Transcription Area */}
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', alignItems: 'stretch' }}>
                <div style={{ flex: 1, height: '100%', minHeight: 0, width: '100%' }}>
                  {selectedAudioId ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                      <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
                        <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>Транскрипция</h2>
                      </div>
                      <TranscriptionBox transcriptionText={selectedTranscription} transcriptionWords={selectedTranscriptionWords} isLoading={isTranscribing} audioName={currentAudioName} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9e9e9e', border: '2px dashed #e0e0e0', borderRadius: '6px' }}>
                      Выберите аудиозапись для просмотра транскрипции
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: STATISTICS */}
          {activeTab === 'statistics' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
              <div style={{ textAlign: 'center', color: '#9e9e9e' }}>
                <h2 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#616161' }}>Статистика</h2>
                <p style={{ fontSize: '16px', margin: 0 }}>Вкладка находится в разработке</p>
              </div>
            </div>
          )}

          {/* VIEW 3: ADMIN PANEL */}
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