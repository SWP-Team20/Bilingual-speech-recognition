import { useRef } from 'react';
import { audioApi } from '../api/audioApi';
import uploadIcon from '../assets/upload-icon.svg'; 
import { useToast } from './ui/Toast';

function UploadButton({ onUploadStart, onUploadEnd, userRole, style }) {
  const fileInputRef = useRef(null);
  const toast = useToast();

  // Кнопка недоступна только если роль "user"
  const isUserRole = userRole?.toLowerCase() === 'user';
  const isDisabled = isUserRole;

  const handleButtonClick = () => {
    if (isUserRole) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Генерируем временный ID для UI
    const tempId = `temp-${Date.now()}`;
    
    onUploadStart(file.name, tempId);
    toast.info(`Загрузка «${file.name}»...`);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    audioApi.uploadAudioFile(file)
      .then(() => {
        onUploadEnd(tempId, true); // Успех
        toast.success(`«${file.name}» загружен и обрабатывается`);
      })
      .catch((error) => {
        console.error("Ошибка загрузки:", error);
        toast.error(`Не удалось обработать аудио: ${file.name}`);
        onUploadEnd(tempId, false); // Ошибка
      });
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={isDisabled}
        onMouseEnter={(e) => {
          if (isDisabled) return;
          e.currentTarget.style.backgroundColor = '#cfcfcf';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.12)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          if (isDisabled) return;
          e.currentTarget.style.backgroundColor = '#d9d9d9';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        style={{ 
          width: '160px',             
          height: '48px', 
          padding: 0,
          backgroundColor: isDisabled ? '#e0e0e0' : '#d9d9d9', 
          color: isDisabled ? '#a0a0a0' : '#000',
          border: 'none', 
          borderRadius: '8px', 
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
          boxShadow: isDisabled ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
          ...style 
        }}
        title={isUserRole ? "Загрузка доступна только менеджерам и администраторам" : ""}
      >
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