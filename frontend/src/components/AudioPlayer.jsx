import React from 'react';
import { BACKEND_URLS } from '../api/audioApi';

function AudioPlayer({ audio, index, isSelected, onTranscribeToggle }) {
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
        <audio
          src={`${BACKEND_URLS.list}${audio.id}?type=processed`}
          controls
          style={{ width: '100%', marginBottom: '8px', display: 'block' }}
        />
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