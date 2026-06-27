import React, { useState, useEffect } from 'react';
import { audioApi } from '../api/audioApi';

function AudioPlayer({ audio, index, isSelected, onTranscribeToggle, onDeleteSuccess, userRole }) {
  const [currentStatus, setCurrentStatus] = useState(audio.status);
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Проверяем, является ли пользователь обычным юзером
  const isUserRole = userRole?.toLowerCase() === 'user';
  // Блокируем кнопку, если идет удаление ИЛИ если у пользователя роль "user"
  const isDeleteDisabled = isDeleting || isUserRole;

  const isAudioProcessing = currentStatus === 'processing_audio' || currentStatus === 'processing';
  const isTextProcessing = currentStatus === 'processing_text';
  const isFullyDone = currentStatus === 'done';

  // 1. CLEAN POLLING CONTROLLER
  useEffect(() => {
    // Stop polling immediately if we are in a terminal state
    if (currentStatus === 'done' || currentStatus === 'error') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const data = await audioApi.fetchAudioStatus(audio.id);
        if (data.status !== currentStatus) {
          setCurrentStatus(data.status);
        }
      } catch (error) {
        console.error("Ошибка при опросе статуса:", error);
      }
    }, 3000);

    // Clears the old interval whenever currentStatus changes or component unmounts
    return () => clearInterval(interval);
  }, [currentStatus, audio.id]);

  // 2. AUDIO STREAM LOADING
  useEffect(() => {
    if (!audio.id || isAudioProcessing) return;

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
  }, [audio.id, isAudioProcessing]);

  if (isAudioProcessing) {
    return (
      <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
        <style>{`
          @keyframes pulseText { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        `}</style>
        <div style={{ fontWeight: '500', margin: '0 0 8px 0', color: '#555' }}>
          Загрузка: {audio.filename || `Аудио ${index + 1}`}
        </div>
        <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '4px', border: '1px dashed #bbb', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '15px', color: '#773505', textAlign: 'center', fontWeight: 'bold', animation: 'pulseText 1.5s infinite ease-in-out' }}>
            Аудио обрабатывается ИИ...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
      <div style={{ fontWeight: '500', textAlign: 'left', padding: 0, margin: '0 0 8px 0', color: '#000' }}>
        Аудио {index + 1} ({audio.filename})
      </div>

      <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
            Загрузка аудиозаписи...
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <audio src={audioUrl || undefined} controls style={{ flex: 1, display: 'block' }} />
            <button
              onClick={handleDeleteClick}
              disabled={isDeleteDisabled}
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
            >
              {isDeleting ? '...' : '✕'}
            </button>
          </div>
        )}

        <button
          onClick={() => isFullyDone && onTranscribeToggle(audio.id)}
          disabled={!isFullyDone}
          style={{
            padding: '6px 12px',
            backgroundColor: !isFullyDone ? '#e0e0e0' : (isSelected ? '#522504' : '#773505'),
            color: !isFullyDone ? '#757575' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isFullyDone ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            width: '100%',
            fontWeight: '550',
            transition: 'background-color 0.2s ease, color 0.2s ease'
          }}
        >
          {isTextProcessing && 'Транскрипция генерируется ИИ...'}
          {currentStatus === 'error' && 'Ошибка обработки'}
          {isFullyDone && (isSelected ? 'Спрятать транскрипцию' : 'Показать транскрипцию')}
        </button>
      </div>
    </div>
  );

  async function handleDeleteClick() {
    if (isUserRole) return;
    if (!window.confirm(`Вы уверены, что хотите удалить "Аудио ${index + 1}"?`)) return;

    try {
      setIsDeleting(true);
      await audioApi.deleteAudio(audio.id);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error) {
      console.error("Ошибка при удалении аудио:", error);
      alert("Не удалось удалить аудиозапись.");
    } finally {
      setIsDeleting(false);
    }
  }
}

export default AudioPlayer;