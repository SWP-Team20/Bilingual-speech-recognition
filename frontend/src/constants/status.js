// Audio processing status values returned by the backend.
export const STATUS = {
  PROCESSING_AUDIO: 'processing_audio',
  PROCESSING: 'processing',
  PROCESSING_TEXT: 'processing_text',
  DONE: 'done',
  ERROR: 'error',
};

export const isAudioProcessing = (status) =>
  status === STATUS.PROCESSING_AUDIO || status === STATUS.PROCESSING;

export const isTextProcessing = (status) => status === STATUS.PROCESSING_TEXT;

export const isDone = (status) => status === STATUS.DONE;

export const isError = (status) => status === STATUS.ERROR;

// A status is "terminal" when it will not change without user action.
export const isTerminal = (status) =>
  status === STATUS.DONE || status === STATUS.ERROR;
