import { useState, useEffect } from 'react';
import { audioApi } from '../api/audioApi';
import UploadButton from '../components/UploadButton';
import AudioPlayer from '../components/AudioPlayer';
import TranscriptionBox from '../components/TranscriptionBox';

function DashboardPage() {
  const [audioList, setAudioList] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState(null);
  const [selectedTranscription, setSelectedTranscription] = useState('');
  const [selectedTranscriptionWords, setSelectedTranscriptionWords] = useState([]);

  useEffect(() => {
    loadAudioList();
  }, []);

  const loadAudioList = async () => {
    try {
      const data = await audioApi.fetchAudioList();
      setAudioList(data);
    } catch (error) {
      console.error("Failed to load audio tracks:", error);
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
        const data = await audioApi.fetchTranscription(audioId);
        setSelectedTranscription(data.transcription_text || 'No transcription found');
        setSelectedTranscriptionWords(data.words || []);
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

        {/* Header Control Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>AUDIO STREAMS</h2>
          <UploadButton onUploadSuccess={loadAudioList} />
        </div>

        {/* Workspace Matrix split layout */}
        <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 250px)' }}>

          {/* Left Block Container: Stream Lists */}
          <div style={{
            flex: '0 0 50%',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {audioList.map((audio, index) => (
                <AudioPlayer
                  key={audio.id}
                  audio={audio}
                  index={index}
                  isSelected={selectedAudioId === audio.id}
                  onTranscribeToggle={handleTranscribeClick}
                />
              ))}
            </div>
          </div>

          {/* Right Block Container: Transcriptions Display Panel */}
          <div style={{ flex: '0 0 50%', overflowY: 'auto' }}>
            {selectedAudioId && (
              <TranscriptionBox 
                transcriptionText={selectedTranscription}
                transcriptionWords={selectedTranscriptionWords}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;