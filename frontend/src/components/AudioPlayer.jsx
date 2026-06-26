import React, { useState, useEffect } from 'react';
import { audioApi } from '../api/audioApi';

function AudioPlayer({ audio, index, isSelected, onTranscribeToggle, onDeleteSuccess, userRole }) {
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Проверяем, является ли пользователь обычным юзером
  const isUserRole = userRole?.toLowerCase() === 'user';
  // Блокируем кнопку, если идет удаление ИЛИ если у пользователя роль "user"
  const isDeleteDisabled = isDeleting || isUserRole;

  useEffect(() => {
    if (!audio.id) return;

    let localUrl = '';
    const loadAudioFile = async () => {
      try {
        setLoading(true);
        localUrl = await audioApi.fetchAudioFile(audio.id, 'processed');
        setAudioUrl(localUrl);
      } catch (error) {
        console.error(`Ошибка загрузки аудиозаписи ${audio.id}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadAudioFile();

    return () => {
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [audio.id]);

  const handleDeleteClick = async () => {
    if (isUserRole) return;

    if (!window.confirm(`Вы уверены, что хотите удалить "Аудио ${index + 1}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await audioApi.deleteAudio(audio.id);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      console.error("Ошибка при удалении аудио:", error);
      const backendMessage = error.response?.data?.detail;
      if (backendMessage && typeof backendMessage === 'string') {
        alert(backendMessage);
      } else {
        alert("Не удалось удалить аудиозапись.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>

      {/* Label Title */}
      <div style={{
        fontWeight: '500',
        textAlign: 'left',
        padding: 0,
        margin: '0 0 8px 0',
        color: '#000'
      }}>
        Аудио {index + 1}
      </div>

      <div style={{
        backgroundColor: '#fff',
        padding: '12px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        boxSizing: 'border-box'
      }}>
        {loading ? (
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
            Загрузка аудиозаписи...
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <audio
              src={audioUrl || undefined}
              controls
              style={{ flex: 1, display: 'block' }}
            />
            <button
              onClick={handleDeleteClick}
              disabled={isDeleteDisabled}
              title={isUserRole ? "Удаление доступно только администраторам" : "Удалить запись"}
              style={{
                backgroundColor: 'transparent',
                color: isDeleteDisabled ? '#ccc' : '#d32f2f',
                border: `1px solid ${isDeleteDisabled ? '#ddd' : '#d32f2f'}`,
                borderRadius: '4px',
                padding: '6px 10px',
                cursor: isDeleteDisabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isUserRole ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => !isDeleteDisabled && (e.currentTarget.style.backgroundColor = '#fff5f5')}
              onMouseOut={(e) => !isDeleteDisabled && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {isDeleting ? '...' : '✕'}
            </button>
          </div>
        )}

        <button
          onClick={() => onTranscribeToggle(audio.id)}
          style={{
            padding: '6px 12px',
            backgroundColor: isSelected ? '#522504' : '#773505',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%',
            fontWeight: '550',
            transition: 'background-color 0.2s ease'
          }}
        >
          {isSelected ? 'Спрятать транскрипцию' : 'Показать транскрипцию'}
        </button>
      </div>
    </div>
  );
}

export default AudioPlayer;