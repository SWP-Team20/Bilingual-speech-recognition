import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function App() {
  const [audioList, setAudioList] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState(null);
  const [selectedTranscription, setSelectedTranscription] = useState('');
  const [selectedTranscriptionWords, setSelectedTranscriptionWords] = useState([]);
  const fileInputRef = useRef(null);

  const BACKEND_URL = 'http://10.93.26.206:8000/upload-audio/';
  const AUDIO_LIST_URL = 'http://10.93.26.206:8000/audio/';
  const TRANSCRIPTION_URL = 'http://10.93.26.206:8000/transcriptions/';

  useEffect(() => {
    loadAudioList();
  }, []);

  const loadAudioList = async () => {
    try {
      const response = await axios.get(AUDIO_LIST_URL);
      setAudioList(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(BACKEND_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadAudioList();
      fileInputRef.current.value = '';
    } catch (error) {
      console.error(error);
      alert("Error uploading audio.");
    }
  };

  const handleTranscribeClick = async (audioId) => {
    if (selectedAudioId === audioId) {
      setSelectedAudioId(null);
      setSelectedTranscription('');
      setSelectedTranscriptionWords([]);
    } else {
      setSelectedAudioId(audioId);
      try {
        const response = await axios.get(`${TRANSCRIPTION_URL}${audioId}`);
        setSelectedTranscription(response.data.transcription_text || 'No transcription found');
        setSelectedTranscriptionWords(response.data.words || []);
      } catch (error) {
        console.error(error);
        setSelectedTranscription('Error loading transcription');
        setSelectedTranscriptionWords([]);
      }
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Main Title */}
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 20px 0', textAlign: 'center' }}>
          Bilingual Speech Recognition
        </h1>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>AUDIO STREAMS</h2>
          <button
            onClick={handleUploadClick}
            style={{ padding: '8px 16px', backgroundColor: '#bbb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Upload
          </button>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 250px)' }}>

          {/* Left: Audio list with players */}
          <div style={{
            flex: '0 0 50%',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {audioList.map((audio, index) => (
                <div key={audio.id}>
                  <div style={{ marginBottom: '8px', fontWeight: '500' }}>Audio {index + 1}</div>
                  <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }}>
                    <audio
                      controls
                      style={{ width: '100%', marginBottom: '8px' }}
                    >
                      <source src={`http://10.93.26.206:8000/audio/${audio.id}?type=processed`} />
                    </audio>
                    <button
                      onClick={() => handleTranscribeClick(audio.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: selectedAudioId === audio.id ? '#0066cc' : '#0099ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        width: '100%'
                      }}
                    >
                      {selectedAudioId === audio.id ? 'Hide Transcription' : 'Transcribe'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Transcription panel */}
          <div style={{ flex: '0 0 50%', overflowY: 'auto' }}>
            {selectedAudioId && (
              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '4px', border: '1px solid #ddd', height: '100%' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Transcription</h3>
                <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#e8f5ea', border: '1px solid #c8e6c9', fontSize: '13px', color: '#2b4f36', fontWeight: 500 }}>
                  Color legend: <span style={{ color: '#333', fontWeight: 700 }}>Russian = black</span>, <span style={{ color: '#009a55', fontWeight: 700 }}>Tatar = green</span>.
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px' }}>
                  {selectedTranscriptionWords.length > 0 ? (
                    selectedTranscriptionWords.map((word, index) => (
                      <span
                        key={index}
                        style={{ color: word.lang === 'tt' ? '#009a55' : '#333' }}
                      >
                        {word.text}{index < selectedTranscriptionWords.length - 1 ? ' ' : ''}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#333' }}>{selectedTranscription}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

export default App;
