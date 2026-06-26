import React from 'react';

function TranscriptionBox({ transcriptionText, transcriptionWords, audioName }) {
  return (
    <div style={{ 
      backgroundColor: '#fff', 
      padding: '24px', 
      borderRadius: '4px', 
      border: '1px solid #ddd', 
      height: 'fit-content', 
      boxSizing: 'border-box',
      width: '100%'
    }}>
      
      {/* ================= LANGUAGE BADGES BAR ================= */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '12px',
        width: '100%'
      }}>
        {/* Russian Box */}
        <div style={{
          width: '90px',
          padding: '3px 0',
          backgroundColor: '#000000',
          border: '1px solid #000000',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          Русский
        </div>

        {/* Tatar Box */}
        <div style={{
          width: '90px',
          padding: '3px 0',
          backgroundColor: '#009a55', 
          border: '1px solid #009a55',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          Татарский
        </div>
      </div>

      {/* ================= AUDIO FILE NAME LABEL ================= */}
      {audioName && (
        <div style={{
          fontSize: '15px',
          fontWeight: '700',
          color: '#555',
          textAlign: 'left',
          marginTop: '20px',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px dashed #eee'
        }}>
          {audioName}
        </div>
      )}

      {/* ================= PRESERVED WORD STREAM PROCESSING CONTAINER ================= */}
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '16px', textAlign: 'left', fontWeight: '500', marginTop: '-8px' }}>
        {transcriptionWords && transcriptionWords.length > 0 ? (
          transcriptionWords.map((word, index) => (
            <span
              key={index}
              style={{ color: word.lang === 'tt' ? '#009a55' : '#333' }}
            >
              {word.text}{index < transcriptionWords.length - 1 ? ' ' : ''}
            </span>
          ))
        ) : (
          <span style={{ color: '#333' }}>{transcriptionText}</span>
        )}
      </div>
    </div>
  );
}

export default TranscriptionBox;