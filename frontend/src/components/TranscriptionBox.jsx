import React from 'react';

function TranscriptionBox({ transcriptionText, transcriptionWords, sentences, audioName }) {
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

      {/* ================= DIARIZED SPEAKER DIALOGUE FLOW ================= */}
      <div style={{ lineHeight: '1.6', fontSize: '16px', textAlign: 'left', marginTop: '12px' }}>
        {sentences && sentences.length > 0 ? (
          // Render via organized speaker sentences if available
          sentences.map((sentence, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', color: '#773505', fontSize: '14px', marginBottom: '2px' }}>
                {sentence.speaker || 'Неизвестный говорящий'}:
              </span>
              <p style={{ margin: 0, fontWeight: '500', color: '#333' }}>
                {sentence.words && sentence.words.length > 0 ? (
                  sentence.words.map((word, wIdx) => (
                    <span
                      key={wIdx}
                      style={{ color: word.lang === 'tt' ? '#009a55' : '#333' }}
                    >
                      {word.raw || word.text}{' '}
                    </span>
                  ))
                ) : (
                  sentence.text
                )}
              </p>
            </div>
          ))
        ) : transcriptionWords && transcriptionWords.length > 0 ? (
          // Fallback if only flat words array is available: Group by speaker shifts on the fly
          (() => {
            const paragraphs = [];
            let currentSpeaker = null;
            let currentWords = [];

            transcriptionWords.forEach((word) => {
              const wordSpeaker = word.speaker || 'Говорящий';
              if (wordSpeaker !== currentSpeaker) {
                if (currentWords.length > 0) {
                  paragraphs.push({ speaker: currentSpeaker, words: currentWords });
                }
                currentSpeaker = wordSpeaker;
                currentWords = [word];
              } else {
                currentWords.push(word);
              }
            });
            if (currentWords.length > 0) {
              paragraphs.push({ speaker: currentSpeaker, words: currentWords });
            }

            return paragraphs.map((p, pIdx) => (
              <div key={pIdx} style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold', color: '#773505', fontSize: '14px', marginBottom: '2px' }}>
                  {p.speaker}:
                </span>
                <p style={{ margin: 0, fontWeight: '500' }}>
                  {p.words.map((word, wIdx) => (
                    <span key={wIdx} style={{ color: word.lang === 'tt' ? '#009a55' : '#333' }}>
                      {word.raw || word.text}{' '}
                    </span>
                  ))}
                </p>
              </div>
            ));
          })()
        ) : (
          // Simple string fallback
          <span style={{ color: '#333', fontWeight: '500' }}>{transcriptionText}</span>
        )}
      </div>
    </div>
  );
}

export default TranscriptionBox;