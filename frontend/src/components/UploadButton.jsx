import { useState, useRef } from 'react';
import { audioApi } from '../api/audioApi';
import uploadIcon from '../assets/upload-icon.svg'; 

function UploadButton({ onUploadSuccess, userRole, style }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Проверяем, является ли пользователь обычным юзером
  const isUserRole = userRole?.toLowerCase() === 'user';
  // Кнопка должна быть выключена, если идет загрузка ИЛИ если роль пользователя - user
  const isDisabled = isUploading || isUserRole;

  const handleButtonClick = () => {
    if (isUserRole) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await audioApi.uploadAudioFile(file);
      await onUploadSuccess();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error(error);
      alert("Ошибка загрузки аудио.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes buttonSpinner {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <button
        onClick={handleButtonClick}
        disabled={isDisabled}
        style={{ 
          width: '160px',             
          height: '48px', 
          padding: 0,
          backgroundColor: isDisabled ? '#e0e0e0' : '#d9d9d9', 
          color: isDisabled ? '#a0a0a0' : '#000',
          border: 'none', 
          borderRadius: '4px', 
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '18px',
          display: 'inline-flex',     
          alignItems: 'center',      
          justifyContent: 'center',    
          verticalAlign: 'middle',
          gap: '12px',
          boxSizing: 'border-box',
          opacity: isUserRole ? 0.7 : 1,
          ...style 
        }}
        title={isUserRole ? "Загрузка доступна только менеджерам и администраторам" : ""}
      >
        {isUploading ? (
          /* Processing State */
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(0,0,0,0.2)',
            borderTopColor: '#000',
            borderRadius: '50%',
            animation: 'buttonSpinner 0.6s linear infinite'
          }} />
        ) : (
          /* Normal State */
          <>
            <span>Загрузить</span> 
            <img 
              src={uploadIcon} 
              alt="" 
              style={{ 
                width: '24px', 
                height: '24px', 
                objectFit: 'contain',
                display: 'block',
                transform: 'translateY(-1px)',
                filter: isDisabled ? 'grayscale(1) opacity(0.5)' : 'none'
              }} 
            />
          </>
        )}
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