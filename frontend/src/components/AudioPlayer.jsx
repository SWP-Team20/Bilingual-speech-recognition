import React, { useState, useEffect } from 'react';
import { audioApi } from '../api/audioApi';

function AudioPlayer({ audio, index, isSelected, onTranscribeToggle }) {
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);

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
        Audio {index + 1}
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
            Загрузка аудиопотока...
          </div>
        ) : (
          <audio
            src={audioUrl || undefined}
            controls
            style={{ width: '100%', marginBottom: '8px', display: 'block' }}
          />
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
          {isSelected ? 'Hide Transcription' : 'Transcribe'}
        </button>
      </div>
    </div>
  );
}

export default AudioPlayer;
