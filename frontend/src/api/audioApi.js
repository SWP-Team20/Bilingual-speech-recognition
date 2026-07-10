import apiClient from './apiClient';

function parseFilterWords(value) {
  if (!value || !String(value).trim()) return [];
  return String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

// Extract the filename from a Content-Disposition header, supporting both the
// RFC 5987 `filename*=UTF-8''...` form (used for non-ASCII names) and plain `filename="..."`.
function parseFilename(contentDisposition) {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (plainMatch) return plainMatch[1].trim();

  return null;
}

export const audioApi = {
  // Matches GET /api/v1/audio/ (supports optional corpus filters)
  fetchAudioList: async (filters = {}) => {
    const params = {};
    const words = parseFilterWords(filters.words);
    if (words.length) params.q = words;
    if (filters.langs?.length) params.lang = filters.langs;
    if (filters.status) params.status = filters.status;
    if (Array.isArray(filters.speakers) && filters.speakers.length) {
      params.speaker = filters.speakers;
    } else if (filters.speaker && filters.speaker.trim()) {
      params.speaker = filters.speaker.trim();
    }
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;

    const response = await apiClient.get('/api/v1/audio/', {
      params,
      paramsSerializer: { indexes: null },
    });
    return response.data;
  },

  // Matches GET /api/v1/audio/by-filename
  searchByFilename: async (filename) => {
    const response = await apiClient.get('/api/v1/audio/by-filename', {
      params: { filename: filename.trim() },
    });
    return response.data;
  },

  // Matches POST /api/v1/upload-audio/
  uploadAudioFile: async (file, { title, recordedAt } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (recordedAt) formData.append('recorded_at', recordedAt);

    const response = await apiClient.post('/api/v1/upload-audio/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Matches GET /api/v1/audio/{audio_id}/status
  fetchAudioStatus: async (audioId) => {
    const response = await apiClient.get(`/api/v1/audio/${audioId}/status`);
    return response.data;
  },

  // Matches GET /api/v1/audio/{audio_id}/sizes
  fetchAudioSizes: async (audioId) => {
    const response = await apiClient.get(`/api/v1/audio/${audioId}/sizes`);
    return response.data;
  },

  // Matches GET /api/v1/audio/storage/total
  fetchTotalStorage: async () => {
    const response = await apiClient.get('/api/v1/audio/storage/total');
    return response.data;
  },

  // Matches GET /api/v1/audio/{audio_id}?type=processed
  fetchAudioFile: async (audioId, type) => {
    const response = await apiClient.get(`/api/v1/audio/${audioId}?type=${type}`, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  },

  // Matches GET /api/v1/audio/{audio_id}?type=original|processed
  // Fetches the file as a blob and triggers a browser download.
  downloadAudioFile: async (audioId, type, fallbackName) => {
    const response = await apiClient.get(`/api/v1/audio/${audioId}?type=${type}`, {
      responseType: 'blob'
    });

    const fileName = parseFilename(response.headers['content-disposition'])
      || `${type}_${fallbackName || audioId}`;

    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  // Matches GET /api/v1/transcriptions/{audio_id}
  fetchTranscription: async (audioId) => {
    const response = await apiClient.get(`/api/v1/transcriptions/${audioId}`);
    return response.data;
  },

  // Matches GET /api/v1/transcriptions/{audio_id}/download?format=txt|json
  downloadTranscription: async (audioId, format, fallbackName) => {
    const response = await apiClient.get(`/api/v1/transcriptions/${audioId}/download`, {
      params: { format },
      responseType: 'blob',
    });

    const fileName = parseFilename(response.headers['content-disposition'])
      || `transcription_${fallbackName || audioId}.${format}`;

    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  // Matches PATCH /api/v1/transcriptions/{audio_id}/words/{position}
  // Edit an existing word's spelling and/or language tag. Returns { words, sentences, stats }.
  editTranscriptionWord: async (audioId, position, { raw, text, language } = {}) => {
    const body = {};
    if (raw !== undefined) body.raw = raw;
    if (text !== undefined) body.text = text;
    if (language !== undefined) body.language = language;
    const response = await apiClient.patch(`/api/v1/transcriptions/${audioId}/words/${position}`, body);
    return response.data;
  },

  // Matches POST /api/v1/transcriptions/{audio_id}/words
  // Insert a new word at the given index. Returns { words, sentences, stats }.
  addTranscriptionWord: async (audioId, { position, raw, language = 'unknown' }) => {
    const response = await apiClient.post(`/api/v1/transcriptions/${audioId}/words`, {
      position, raw, language,
    });
    return response.data;
  },

  // Matches DELETE /api/v1/transcriptions/{audio_id}/words/{position}
  deleteTranscriptionWord: async (audioId, position) => {
    const response = await apiClient.delete(`/api/v1/transcriptions/${audioId}/words/${position}`);
    return response.data;
  },

  // Matches PATCH /api/v1/transcriptions/{audio_id}/words/bulk
  bulkEditTranscriptionWords: async (audioId, positions, {
    language, delete: isDelete = false, speakerId, newLabel,
  } = {}) => {
    const body = { positions };
    if (isDelete) body.delete = true;
    else if (language !== undefined) body.language = language;
    else if (speakerId != null) body.speaker_id = speakerId;
    else if (newLabel != null && String(newLabel).trim()) body.new_label = String(newLabel).trim();
    const response = await apiClient.patch(`/api/v1/transcriptions/${audioId}/words/bulk`, body);
    return response.data;
  },

  // Matches PATCH /api/v1/transcriptions/{audio_id}/speakers
  // Relabel a speaker in this audio. Pass speakerId OR newLabel.
  // scope: 'audio' (all occurrences) | 'paragraph' (wordPositions only)
  relabelSpeaker: async (audioId, { currentLabel, newLabel, speakerId, scope = 'audio', wordPositions } = {}) => {
    const body = { current_label: currentLabel, scope };
    if (speakerId != null) body.speaker_id = speakerId;
    if (newLabel != null && String(newLabel).trim()) body.new_label = String(newLabel).trim();
    if (scope === 'paragraph' && Array.isArray(wordPositions)) {
      body.word_positions = wordPositions;
    }
    const response = await apiClient.patch(`/api/v1/transcriptions/${audioId}/speakers`, body);
    return response.data;
  },

  // Matches DELETE /api/v1/audio/{audio_id}
  deleteAudio: async (audioId) => {
    const response = await apiClient.delete(`/api/v1/audio/${audioId}`);
    return response.data;
  },

  // Matches POST /api/v1/audio/{audio_id}/restore
  restoreAudio: async (audioId) => {
    const response = await apiClient.post(`/api/v1/audio/${audioId}/restore`);
    return response.data;
  },

  // Matches POST /api/v1/transcriptions/{audio_id}/undo
  undoTranscriptionDelete: async (audioId) => {
    const response = await apiClient.post(`/api/v1/transcriptions/${audioId}/undo`);
    return response.data;
  },

  // Matches PATCH /api/v1/audio/{audio_id}
  updateAudioMetadata: async (audioId, { title, recordedAt } = {}) => {
    const body = {};
    if (title !== undefined) body.title = title;
    if (recordedAt !== undefined) body.recorded_at = recordedAt || null;
    const response = await apiClient.patch(`/api/v1/audio/${audioId}`, body);
    return response.data;
  },
};