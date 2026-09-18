'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import type { DocumentDetail, SourceChunk } from '@docura/contracts';
import { Download, Pause, Play } from '@/components/icons';
import { SearchField } from '@/components/ui/search-field';
import { SpeakerNames } from '@/components/speaker-names';
import { api } from '@/lib/document-api';
import { formatAudioTime } from '@/lib/document-format';

/** Review speaker turns and play the recording at a cited timestamp. */
export function AudioTranscriptView({
  document,
  selected
}: {
  document: DocumentDetail;
  selected?: string;
}) {
  const player = useRef<HTMLAudioElement>(null);
  const [search, setSearch] = useState('');
  const [playbackError, setPlaybackError] = useState('');
  const [playback, setPlayback] = useState({ playing: false, time: 0 });
  const activeChunk = document.chunks.find(
    (chunk) =>
      chunk.startSeconds !== undefined &&
      chunk.endSeconds !== undefined &&
      playback.time >= chunk.startSeconds &&
      playback.time < chunk.endSeconds
  );
  const selectedChunk = document.chunks.find((chunk) => chunk.id === selected);
  const selectedStart = selectedChunk?.startSeconds;
  const chunks = document.chunks.filter((chunk) =>
    chunk.text.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (player.current && player.current.readyState >= 1 && selectedStart !== undefined) {
      player.current.currentTime = selectedStart;
    }
  }, [selectedStart]);

  /** Keep transcript controls synchronized with native playback and seeking. */
  function syncPlayback(event: SyntheticEvent<HTMLAudioElement>) {
    const audio = event.currentTarget;
    setPlayback({
      playing: !audio.paused && !audio.ended && !audio.error,
      time: audio.currentTime
    });
  }

  /** Pause the current passage, resume it, or seek to another passage. */
  async function togglePlayback(chunk: SourceChunk) {
    const audio = player.current;
    if (!audio) return;
    const withinPassage =
      audio.currentTime >= (chunk.startSeconds ?? 0) && audio.currentTime < (chunk.endSeconds ?? 0);
    if (withinPassage && !audio.paused) {
      audio.pause();
      return;
    }
    setPlaybackError('');
    if (!withinPassage) audio.currentTime = chunk.startSeconds ?? 0;
    try {
      await audio.play();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setPlaybackError(
        'Playback could not start. Use the player controls or download the recording.'
      );
    }
  }

  function downloadTranscript() {
    const text =
      document.transcript?.segments
        .map(
          (segment) =>
            `[${formatAudioTime(segment.startSeconds)}–${formatAudioTime(segment.endSeconds)}] ${document.transcript?.speakerNames?.[segment.speaker] || segment.speaker}\n${segment.text}`
        )
        .join('\n\n') ??
      document.chunks.map((chunk) => `${chunk.location}\n${chunk.text}`).join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${document.name.replace(/\.[^.]+$/, '')}-transcript.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section aria-label="Audio transcript" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Conversation transcript</h2>
          <p className="mt-1 text-xs text-muted-foreground" id="transcript-note">
            Name the speakers you know. Check important details against the recording.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-primary">
          <button
            onClick={downloadTranscript}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 hover:bg-soft">
            <Download size={14} /> Transcript
          </button>
          <a
            href={`${api.file(document.id)}?download=1`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 hover:bg-soft">
            <Download size={14} /> Audio
          </a>
        </div>
      </div>
      <SpeakerNames document={document} />
      <div className="rounded-xl border border-border bg-white p-3">
        <audio
          ref={player}
          src={api.file(document.id)}
          controls
          preload="metadata"
          aria-label={`Play ${document.name}`}
          aria-describedby="transcript-note"
          className="h-10 w-full"
          onPlay={syncPlayback}
          onPause={syncPlayback}
          onEnded={syncPlayback}
          onTimeUpdate={syncPlayback}
          onSeeked={syncPlayback}
          onEmptied={syncPlayback}
          onLoadedMetadata={() => {
            if (player.current && selectedChunk?.startSeconds !== undefined) {
              player.current.currentTime = selectedChunk.startSeconds;
            }
          }}
          onError={(event) => {
            syncPlayback(event);
            setPlaybackError(
              'This browser could not play the recording. Download the audio to listen.'
            );
          }}
        />
        {playbackError && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {playbackError}
          </p>
        )}
      </div>
      <SearchField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label="Search transcript"
        placeholder="Find in conversation…"
      />
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
        {chunks.map((chunk) => {
          const playing = playback.playing && activeChunk?.id === chunk.id;
          const originalSpeaker = chunk.speakerId ?? chunk.speaker;
          return (
            <article
              key={chunk.id}
              id={`source-${chunk.id}`}
              data-highlighted={selected === chunk.id}
              className="scroll-m-4 px-4 py-4 data-[highlighted=true]:bg-soft">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-xs font-semibold text-ink">
                  {chunk.speaker ?? 'Speaker'}
                </strong>
                <button
                  onClick={() => void togglePlayback(chunk)}
                  aria-label={`${playing ? 'Pause' : 'Play'} ${chunk.location}`}
                  aria-pressed={playing}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs tabular-nums text-primary hover:bg-soft aria-pressed:bg-soft">
                  {playing ? <Pause size={13} /> : <Play size={13} />}
                  {formatAudioTime(chunk.startSeconds ?? 0)}–
                  {formatAudioTime(chunk.endSeconds ?? 0)}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 wrap-anywhere text-copy">
                {originalSpeaker && chunk.text.startsWith(`${originalSpeaker}: `)
                  ? chunk.text.slice(originalSpeaker.length + 2)
                  : chunk.text}
              </p>
            </article>
          );
        })}
        {!chunks.length && (
          <p className="p-4 text-sm text-muted-foreground">
            No transcript passages match your search.
          </p>
        )}
      </div>
    </section>
  );
}
