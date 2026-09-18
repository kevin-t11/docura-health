/** Shared document, processing, and chat API types. */
export const stages = ['started', 'extracted', 'parsed', 'chunked', 'embedded', 'stored'] as const;
export type Stage = (typeof stages)[number];
export type DocumentStatus = 'queued' | Stage | 'failed';
export interface SourceChunk {
  id: string;
  text: string;
  page: number;
  location: string;
  index: number;
  startSeconds?: number;
  endSeconds?: number;
  speaker?: string;
  speakerId?: string;
}
/** A saved conversation transcript with model-generated speaker labels. */
export interface AudioTranscript {
  speakerNames?: Record<string, string>;
  text: string;
  durationSeconds: number;
  model: string;
  segments: {
    text: string;
    speaker: string;
    startSeconds: number;
    endSeconds: number;
  }[];
}
export interface Insight {
  text: string;
  sourceIds: string[];
}
export interface TimelineEvent {
  date: string;
  event: string;
  sourceIds: string[];
}
export interface Overview {
  summary: Insight;
  objective: Insight;
  keyPoints: Insight[];
  requirements: Insight[];
  missingItems: Insight[];
  callouts: Insight[];
  timeline: TimelineEvent[];
}
export interface DocumentSummary {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  status: DocumentStatus;
  pageCount: number;
  chunkCount: number;
  extraction?: 'native' | 'ocr' | 'word' | 'csv' | 'audio';
  error?: string;
  history: { status: DocumentStatus; at: string }[];
}
export interface DocumentDetail extends DocumentSummary {
  overview?: Overview;
  transcript?: AudioTranscript;
  chunks: SourceChunk[];
}
export interface Citation {
  id: string;
  label: string;
  text: string;
  page: number;
}
export interface ChatAnswer {
  answer: string;
  citations: Citation[];
}
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}
export interface DocumentChat {
  id: string;
  question: string;
  status: 'pending' | 'completed' | 'failed';
  answer?: ChatAnswer;
  error?: string;
  createdAt: string;
  answeredAt?: string;
}
export interface AppConfig {
  maxUploadMb: number;
  maxAudioUploadMb: number;
  supportedExtensions: string[];
}
