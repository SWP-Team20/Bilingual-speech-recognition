import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioApi } from '../api/audioApi';
import { userApi } from '../api/userApi';
import UploadButton from '../components/UploadButton';
import AudioPlayer from '../components/AudioPlayer';
import TranscriptionBox from '../components/TranscriptionBox';
import ProfileDropdown from '../components/ProfileDropdown';

function DashboardPage({ onLogout }) {
  const navigate = useNavigate();
  const [audioList, setAudioList] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState(null);
  const [selectedTranscription, setSelectedTranscription] = useState('');
  const [selectedTranscriptionWords, setSelectedTranscriptionWords] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

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

  // --- НОВЫЕ ХЭНДЛЕРЫ ДЛЯ ФОНОВОЙ ЗАГРУЗКИ ---
  const handleUploadStart = (fileName, tempId) => {
    // Добавляем временный файл в начало списка загрузок
    setPendingUploads(prev => [{ id: tempId, name: fileName, isPending: true }, ...prev]);
  };

  const handleUploadEnd = (tempId, isSuccess) => {
    // Убираем временный файл из списка
    setPendingUploads(prev => prev.filter(item => item.id !== tempId));
    // Если бэкенд отработал успешно — обновляем настоящий список
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

  // Объединяем фейковые треки и настоящие
  const combinedAudioList = [...pendingUploads, ...audioList];

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

        {/* MAIN CONTENT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', flex: 1, minHeight: 0 }}>
          
          {/* LEFT SIDE */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', alignItems: 'stretch' }}>
            <div style={{ backgroundColor: '#522504', color: '#fff', borderRadius: '6px', padding: '14px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', width: '100%', boxSizing: 'border-box', flexShrink: 0 }}>
              Аудиозаписи
            </div>

            <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>Аудиозаписи</h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', boxSizing: 'border-box', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                {combinedAudioList.map((audio, index) => (
                  <AudioPlayer
                    key={audio.id}
                    audio={audio}
                    // Убираем индекс у временных файлов, чтобы нумерация не сбивалась
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

          {/* RIGHT SIDE */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', alignItems: 'stretch' }}>
            <button disabled style={{ backgroundColor: '#e0e0e0', color: '#9e9e9e', borderRadius: '6px', padding: '14px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', width: '100%', boxSizing: 'border-box', flexShrink: 0, border: '1px dashed #bdbdbd', cursor: 'not-allowed', fontFamily: 'inherit', letterSpacing: '0.5px' }} title={"Вкладка в разработке"}>
              Статистика
            </button>

            <div style={{ flex: 1, overflowY: 'auto', height: '100%', minHeight: 0, width: '100%' }}>
              {selectedAudioId && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                  <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>Транскрипция</h2>
                  </div>
                  
                  <TranscriptionBox transcriptionText={selectedTranscription} transcriptionWords={selectedTranscriptionWords} isLoading={isTranscribing} audioName={currentAudioName} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;