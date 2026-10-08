import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '../lib/config';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = CONFIG.SUPABASE_URL;
  const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;

  if (url && key && url.startsWith('http')) {
    try {
      supabaseClient = createClient(url, key);
      return supabaseClient;
    } catch (err: any) {
      console.warn('[SUPABASE STORAGE WARNING] Failed to initialize Supabase client:', err.message);
      return null;
    }
  }

  return null;
}

export interface UploadResult {
  url: string;
  path: string;
  isPrivate: boolean;
}

/**
 * Uploads a file (Base64 string or Buffer) to Supabase Storage.
 * Public bucket: player-photos (for player profile avatars)
 * Private bucket: player-documents (for private Aadhaar identification docs)
 */
export async function uploadToSupabaseStorage(params: {
  fileData: string | Buffer;
  fileName: string;
  folder?: string;
  isPrivate?: boolean;
}): Promise<UploadResult> {
  const { fileData, fileName, folder = 'players', isPrivate = false } = params;
  const client = getSupabaseClient();

  // Fallback: If Supabase is not configured, return input data gracefully
  if (!client) {
    return {
      url: typeof fileData === 'string' ? fileData : '',
      path: fileName,
      isPrivate,
    };
  }

  const bucketName = isPrivate
    ? CONFIG.SUPABASE_STORAGE_BUCKET_PRIVATE
    : CONFIG.SUPABASE_STORAGE_BUCKET_PUBLIC;

  let buffer: Buffer;
  let contentType = 'image/jpeg';

  if (typeof fileData === 'string') {
    if (fileData.startsWith('data:')) {
      const parts = fileData.split(';base64,');
      contentType = parts[0].replace('data:', '') || 'image/jpeg';
      buffer = Buffer.from(parts[1], 'base64');
    } else {
      buffer = Buffer.from(fileData, 'utf-8');
    }
  } else {
    buffer = fileData;
  }

  const filePath = `${folder}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const { data, error } = await client.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`[SUPABASE STORAGE ERROR] Bucket: ${bucketName}, File: ${filePath}:`, error.message);
    throw new Error(`Supabase Storage Upload Failed: ${error.message}`);
  }

  if (isPrivate) {
    // Generate 1-hour signed URL for private bucket
    const { data: signedData, error: signedError } = await client.storage
      .from(bucketName)
      .createSignedUrl(data.path, 3600);

    return {
      url: signedError ? data.path : signedData.signedUrl,
      path: data.path,
      isPrivate: true,
    };
  } else {
    // Get public URL for public bucket
    const { data: publicUrlData } = client.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      url: publicUrlData.publicUrl,
      path: data.path,
      isPrivate: false,
    };
  }
}

/**
 * Generates a signed URL for private document access (e.g. Aadhaar verification).
 */
export async function getPrivateDocumentSignedUrl(filePath: string, expiresSeconds = 3600): Promise<string> {
  const client = getSupabaseClient();
  if (!client) return filePath;

  const bucketName = CONFIG.SUPABASE_STORAGE_BUCKET_PRIVATE;
  const { data, error } = await client.storage
    .from(bucketName)
    .createSignedUrl(filePath, expiresSeconds);

  if (error || !data) {
    return filePath;
  }

  return data.signedUrl;
}
