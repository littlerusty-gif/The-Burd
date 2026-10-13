/**
 * Chat Sanitizer & Validation Utilities
 */

const PROFANITY_REGEX =
  /\b(fuck|shit|bitch|asshole|bastard|cunt|dick|pussy|slut|whore|nigger|faggot|retard)\b/gi;

const PHONE_NUMBER_REGEX =
  /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;

const SUSPICIOUS_LINK_REGEX =
  /\b(?:https?:\/\/)?(?:www\.)?(?:[a-zA-Z0-9-]+\.)+(?:exe|zip|apk|scr|bat|vbs|cmd|ru|top|xyz|loan|click|buzz)(?:\/[^\s]*)?/gi;

const GENERIC_SUSPICIOUS_SHORTENERS =
  /\b(?:https?:\/\/)?(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|cutt\.ly|adf\.ly)\/[^\s]+/gi;

/**
 * Validates whether a handle is between 3 and 20 alphanumeric characters (including underscores).
 */
export function validateHandle(handle: string): boolean {
  if (!handle || typeof handle !== 'string') return false;
  const trimmed = handle.trim();
  if (trimmed.length < 3 || trimmed.length > 20) return false;
  return /^[a-zA-Z0-9_]+$/.test(trimmed);
}

/**
 * Filters basic profanity, phone numbers, and suspicious download links/shorteners,
 * replacing them with '[moderated]'.
 */
export function sanitizeMessage(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text;

  cleaned = cleaned.replace(PROFANITY_REGEX, '[moderated]');
  cleaned = cleaned.replace(PHONE_NUMBER_REGEX, '[moderated]');
  cleaned = cleaned.replace(SUSPICIOUS_LINK_REGEX, '[moderated]');
  cleaned = cleaned.replace(GENERIC_SUSPICIOUS_SHORTENERS, '[moderated]');

  return cleaned.trim();
}

export default {
  validateHandle,
  sanitizeMessage,
};
