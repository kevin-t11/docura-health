/** Store originals in S3 and read scanned documents with Textract. */
import { AppError } from '@/errors/app.error';
import { createHash } from 'node:crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand
} from '@aws-sdk/client-textract';
import { type Page } from '@/domain/document';
import type { FileStorage } from '@/domain/ports';
export function cloudStorage(region: string, bucket: string): FileStorage {
  const client = new S3Client({ region });
  return {
    put: async (key, data, contentType) => {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: data,
          ContentType: contentType,
          ServerSideEncryption: 'AES256'
        })
      );
    },
    get: async (key) => {
      const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!result.Body) {
        throw new Error('Empty object body.');
      }
      return Buffer.from(await result.Body.transformToByteArray());
    },
    remove: async (key) => {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }
  };
}
export function textractReader(region: string, bucket: string) {
  const client = new TextractClient({ region });
  return async (key: string, attemptId: string): Promise<Page[]> => {
    const started = await client.send(
      new StartDocumentTextDetectionCommand({
        DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },
        ClientRequestToken: createHash('sha256').update(`${key}:${attemptId}`).digest('hex')
      })
    );
    if (!started.JobId) {
      throw new Error('Textract did not return a job id.');
    }
    const pages = new Map<number, string[]>();
    let nextToken: string | undefined;
    const deadline = Date.now() + 15 * 60_000;
    for (;;) {
      if (Date.now() > deadline) {
        throw new AppError('OCR timed out. Try a smaller document.');
      }
      const result = await client.send(
        new GetDocumentTextDetectionCommand({
          JobId: started.JobId,
          NextToken: nextToken
        })
      );
      if (result.JobStatus === 'IN_PROGRESS') {
        await Bun.sleep(2000);
        continue;
      }
      if (result.JobStatus !== 'SUCCEEDED') {
        throw new AppError('AWS Textract could not read every page of this document.');
      }
      for (const block of result.Blocks ?? []) {
        if (block.BlockType === 'PAGE' && block.Page && !pages.has(block.Page)) {
          pages.set(block.Page, []);
        }
        if (block.BlockType === 'LINE' && block.Text) {
          const page = block.Page ?? 1;
          pages.set(page, [...(pages.get(page) ?? []), block.Text]);
        }
      }
      nextToken = result.NextToken;
      if (!nextToken) {
        break;
      }
    }
    return [...pages.entries()]
      .sort(([a], [b]) => a - b)
      .map(([number, lines]) => ({
        number,
        text: lines.join('\n'),
        location: `Page ${number}`
      }));
  };
}
