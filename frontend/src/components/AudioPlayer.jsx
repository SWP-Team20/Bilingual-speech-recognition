import React from 'react';
import { BACKEND_URLS } from '../api/audioApi';

function AudioPlayer({ audio, index, isSelected, onTranscribeToggle }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ marginBottom: '8px', fontWeight: '500' }}>
        Audio {index + 1}
      </div>
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '12px', 
        borderRadius: '4px', 
        border: '1px solid #ddd' 
      }}>
        <audio
          controls
          style={{ width: '100%', marginBottom: '8px' }}
        >
          <source src={`${BACKEND_URLS.list}${audio.id}?type=processed`} />
        </audio>
        <button
          onClick={() => onTranscribeToggle(audio.id)}
          style={{
            padding: '6px 12px',
            backgroundColor: isSelected ? '#0066cc' : '#0099ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%',
            fontWeight: '500',
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