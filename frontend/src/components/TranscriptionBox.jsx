import React from 'react';

function TranscriptionBox({ transcriptionText, transcriptionWords }) {
  return (
    <div style={{ 
      backgroundColor: '#fff', 
      padding: '16px', 
      borderRadius: '4px', 
      border: '1px solid #ddd', 
      height: '100%',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
        Transcription
      </h3>
      
      {/* Dynamic Color Guide Legend */}
      <div style={{ 
        marginBottom: '14px', 
        padding: '10px 12px', 
        borderRadius: '8px', 
        backgroundColor: '#e8f5ea', 
        border: '1px solid #c8e6c9', 
        fontSize: '13px', 
        color: '#2b4f36', 
        fontWeight: 500 
      }}>
        Color legend: <span style={{ color: '#333', fontWeight: 700 }}>Russian = black</span>, <span style={{ color: '#009a55', fontWeight: 700 }}>Tatar = green</span>.
      </div>

      {/* Structured Word Stream Processing Container */}
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px' }}>
        {transcriptionWords.length > 0 ? (
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