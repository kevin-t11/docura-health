/** Supported document extensions and MIME types. */
export const supportedExtensions = [
  '.pdf',
  '.doc',
  '.docx',
  '.csv',
  '.mp3',
  '.m4a',
  '.wav',
  '.webm'
] as const;
export const MAX_AUDIO_UPLOAD_MB = 20;
export const documentMimeTypes = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.csv': 'text/csv',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm'
} as const;
