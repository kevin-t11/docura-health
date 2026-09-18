'use client';

/** Validate file selection and submit document uploads. */
import { useState } from 'react';
import type { AppConfig, DocumentDetail } from '@docura/contracts';
import { message } from '@/lib/document-api';
import { useUploadDocument } from '@/hooks/use-document-mutations';
import { AttachmentUpload, type AttachmentUploadItem } from '@/components/motion/attachment-upload';
import { Button } from '@/components/ui/button';

export function Upload({
  config,
  onUploaded
}: {
  config?: AppConfig;
  onUploaded: (document: DocumentDetail) => void;
}) {
  const mutation = useUploadDocument();
  const [items, setItems] = useState<AttachmentUploadItem[]>([]);
  const [validationError, setValidationError] = useState('');
  const busy = mutation.isPending;
  const maxUploadMb = config?.maxUploadMb ?? 20;
  const error = validationError || (mutation.error ? message(mutation.error) : '');

  function upload(file?: File, attachment?: AttachmentUploadItem) {
    if (!file || busy || !config) return;
    mutation.reset();
    const invalid = validateUpload(file, config);
    setValidationError(invalid ?? '');
    if (invalid) {
      setItems([]);
      return;
    }
    const item: AttachmentUploadItem = {
      ...attachment,
      id: crypto.randomUUID(),
      name: file.name,
      kind: 'file',
      size: file.size,
      file
    };
    setItems([{ ...item, status: 'uploading' }]);
    mutation.mutate(file, {
      onSuccess: (document) => {
        setItems([]);
        onUploaded(document);
      },
      onError: (error) => setItems([{ ...item, status: 'failed', error: message(error) }])
    });
  }

  return (
    <div className="w-full">
      <AttachmentUpload
        value={items}
        onValueChange={setItems}
        onFilesAdded={(added, files) => upload(files[0], added[0])}
        onFilesRejected={(_files, reason) =>
          setValidationError(
            reason === 'too-large'
              ? `Choose a file smaller than ${maxUploadMb} MB.`
              : 'Upload one document at a time.'
          )
        }
        onRetry={(item) => upload(item.file, item)}
        onRemove={() => {
          mutation.reset();
          setValidationError('');
        }}
        accept={config?.supportedExtensions.join(',')}
        multiple={false}
        maxFiles={1}
        maxFileSize={maxUploadMb * 1024 * 1024}
        disabled={busy || !config}
        title={busy ? 'Uploading your document…' : 'Choose a file or drop it here'}
        description={`PDF, Word, CSV, or audio · Up to ${maxUploadMb} MB`}
        attachmentsLabel="Your document"
        classNames={{
          dropzone:
            'min-h-[clamp(200px,29dvh,260px)] rounded-xl border border-dashed border-[#b8c8ba] bg-white p-6 hover:border-primary hover:bg-[#f1f6ef] data-[dragging=true]:border-primary data-[dragging=true]:bg-[#f1f6ef] max-md:min-h-50 max-md:px-4 md:[@media(max-height:700px)]:min-h-45 [&_[data-slot=upload-frame]]:hidden [&_[data-slot=upload-icon]]:mb-4 [&_[data-slot=upload-icon]]:size-12 [&_[data-slot=upload-icon]]:rounded-xl [&_[data-slot=upload-icon]]:bg-soft [&_[data-slot=upload-title]]:text-base [&_[data-slot=upload-title]]:font-semibold [&_[data-slot=upload-description]]:mt-2 [&_[data-slot=upload-description]]:text-[13px] [&_[data-slot=upload-description]]:leading-[1.6]',
          row: 'rounded-xl'
        }}
      />
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Audio: MP3, M4A, WAV, WebM · Up to {config?.maxAudioUploadMb ?? 20} MB · Transcript included
      </p>
      {error && (
        <p className="my-2 text-[13px] leading-[1.6] wrap-anywhere text-destructive" role="alert">
          {error}
        </p>
      )}
      {error && items.length > 0 && !busy && (
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => {
            setItems([]);
            setValidationError('');
            mutation.reset();
          }}>
          Choose another document
        </Button>
      )}
    </div>
  );
}

function validateUpload(file: File, config: AppConfig): string | undefined {
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!config.supportedExtensions.includes(extension))
    return 'Choose a PDF, Word, CSV, MP3, M4A, WAV, or WebM file.';
  const isAudio = ['.mp3', '.m4a', '.wav', '.webm'].includes(extension);
  const limit = isAudio ? config.maxAudioUploadMb : config.maxUploadMb;
  if (file.size > limit * 1024 * 1024) return `Choose a file smaller than ${limit} MB.`;
  if (!file.size) return 'The file is empty.';
}
