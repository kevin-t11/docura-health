import OpenAI, { toFile } from 'openai';
import { z } from 'zod';
import type { AudioTranscript } from '@/domain/document';
import { AppError } from '@/errors/app.error';

const model = 'gpt-4o-transcribe-diarize';
const transcriptSchema = z.object({
  text: z.string(),
  duration: z.number().nonnegative(),
  segments: z.array(
    z
      .object({
        text: z.string(),
        speaker: z.string(),
        start: z.number().nonnegative(),
        end: z.number().nonnegative()
      })
      .refine((segment) => segment.end >= segment.start)
  )
});

/** Transcribe recorded conversations into timestamped, anonymous speaker turns. */
export function createAudioTranscriber(apiKey: string) {
  const client = new OpenAI({ apiKey, timeout: 10 * 60_000, maxRetries: 1 });

  return async (data: Buffer, name: string, mimeType: string): Promise<AudioTranscript> => {
    let response;
    try {
      response = await client.audio.transcriptions.create({
        file: await toFile(data, name, { type: mimeType }),
        model,
        response_format: 'diarized_json',
        chunking_strategy: 'auto'
      });
    } catch (error) {
      if (error instanceof OpenAI.APIError && (error.status === 400 || error.status === 422)) {
        throw new AppError(
          'This recording could not be transcribed. Try a clear MP3, M4A, WAV, or WebM audio file.'
        );
      }
      throw error;
    }

    const result = transcriptSchema.parse(response);
    const speakers = new Map<string, string>();
    const segments = result.segments
      .filter((segment) => segment.text.trim())
      .sort((a, b) => a.start - b.start)
      .map((segment) => {
        const label = segment.speaker.trim();
        if (!speakers.has(label)) {
          speakers.set(label, label ? `Speaker ${speakers.size + 1}` : 'Unknown speaker');
        }
        return {
          text: segment.text.trim(),
          speaker: speakers.get(label)!,
          startSeconds: segment.start,
          endSeconds: segment.end
        };
      });
    if (!segments.length) {
      throw new AppError(
        'No speech was detected in this recording. Try a recording with clear speech.'
      );
    }
    return {
      text: result.text.trim() || segments.map((segment) => segment.text).join(' '),
      durationSeconds: Math.max(result.duration, ...segments.map((segment) => segment.endSeconds)),
      model,
      segments
    };
  };
}

/** Format a recording offset without implying a calendar date. */
export function audioTimestamp(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
