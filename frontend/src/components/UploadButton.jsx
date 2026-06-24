import { useRef } from 'react';
import { audioApi } from '../api/audioApi';

function UploadButton({ onUploadSuccess }) {
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await audioApi.uploadAudioFile(file);
      await onUploadSuccess();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading audio.");
    }
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        style={{ 
          padding: '8px 16px', 
          backgroundColor: '#bbb', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          fontWeight: '500'
        }}
      >
        Upload
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </>
  );
}

export default UploadButton;