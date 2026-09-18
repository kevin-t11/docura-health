/** Limit general API traffic and expensive document operations. */
import { rateLimit } from 'express-rate-limit';

const options = {
  windowMs: 60_000,
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false
};

export const generalRateLimit = rateLimit({
  ...options,
  limit: 180,
  message: { error: 'Too many requests. Wait a minute and try again.' }
});

export const documentRateLimit = rateLimit({
  ...options,
  limit: 20,
  message: {
    error: 'Please wait a minute before uploading or asking more questions.'
  }
});
