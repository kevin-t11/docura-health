import { MAX_AUDIO_UPLOAD_MB, documentMimeTypes } from '@/constants/upload.constants';
import { AppError } from '@/errors/app.error';
import { fileExtensionSchema, type UploadFile } from '@/schemas/upload.schema';
import { parseInput } from '@/utils/validation.utils';
import { extname } from 'node:path';

/** Bytes that identify a real PDF, old Word .doc, or .docx (ZIP) file. */
const PDF_MARK = Buffer.from('%PDF-');
const DOC_MARK = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const DOCX_MARK = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/**
 * Validate supported document/audio extensions, size, and container signatures.
 *
 * Checks the file name and the first bytes so a renamed file cannot pass.
 *
 * @param file - Uploaded file (name, size, and contents).
 * @returns MIME type for that file kind.
 * @throws {AppError} If the file is empty, the extension is wrong, or the bytes do not match.
 */
export function validateDocumentFile(file: UploadFile): string {
  const extension = parseInput(
    fileExtensionSchema,
    extname(file.originalname).toLowerCase(),
    'Choose a PDF, Word, CSV, MP3, M4A, WAV, or WebM file.',
    415
  );

  if (!file.size) {
    throw new AppError('The file is empty.');
  }

  const bytes = file.buffer;
  const mimeType = documentMimeTypes[extension];
  if (mimeType.startsWith('audio/')) {
    if (file.size > MAX_AUDIO_UPLOAD_MB * 1024 * 1024) {
      throw new AppError(`Audio files must be ${MAX_AUDIO_UPLOAD_MB} MB or smaller.`, 413);
    }
    const valid =
      (extension === '.mp3' &&
        (bytes.subarray(0, 3).toString() === 'ID3' ||
          (bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0))) ||
      (extension === '.wav' &&
        bytes.subarray(0, 4).toString() === 'RIFF' &&
        bytes.subarray(8, 12).toString() === 'WAVE') ||
      (extension === '.m4a' && bytes.subarray(4, 8).toString() === 'ftyp') ||
      (extension === '.webm' && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])));
    if (!valid) {
      throw new AppError(
        'The audio contents do not match the file extension. Export it as MP3, M4A, WAV, or WebM.',
        415
      );
    }
  }

  if (extension === '.pdf' && !bytes.subarray(0, 1024).includes(PDF_MARK)) {
    throw new AppError('The file is not a valid PDF.', 415);
  }

  if (extension === '.docx' && !bytes.subarray(0, 4).equals(DOCX_MARK)) {
    throw new AppError('The file is not a valid DOCX.', 415);
  }

  if (extension === '.doc' && !bytes.subarray(0, 8).equals(DOC_MARK)) {
    throw new AppError('The file is not a valid Word document.', 415);
  }

  if (extension === '.csv' && bytes.includes(0)) {
    throw new AppError('CSV files must contain UTF-8 text.', 415);
  }

  return mimeType;
}

/**
 * Replace control characters and path separators, then cap length at 200.
 *
 * @param name - Original file name from the upload.
 * @returns A name that is safe to store and send in headers.
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[\p{Cc}/\\]/gu, '_').slice(0, 200);
}

/**
 * Build a `Content-Disposition` header for preview or download.
 *
 * PDFs and audio open in the browser unless `download` is true.
 *
 * @param name - File name shown to the user.
 * @param mimeType - File MIME type.
 * @param download - When true, force a download even for PDFs.
 * @returns Header value, for example `inline; filename*=UTF-8''report.pdf`.
 */
export function contentDisposition(name: string, mimeType: string, download: boolean): string {
  const previewable = mimeType === 'application/pdf' || mimeType.startsWith('audio/');
  const kind = previewable && !download ? 'inline' : 'attachment';

  return `${kind}; filename*=UTF-8''${encodeURIComponent(name)}`;
}
