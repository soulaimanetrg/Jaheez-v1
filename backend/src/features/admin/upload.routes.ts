import express, { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabase } from '../../db/supabase';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/admin.middleware';
import { BadRequestError, InternalServerError } from '../../middleware/error.middleware';
import { logger } from '../../config/logger';

const router = Router();

// Max decoded image size: 15MB. The route JSON parser allows more because base64 is larger than the original file.
const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const ALLOWED_FOLDERS = new Set(['general', 'stores', 'products', 'drivers', 'banners', 'categories']);

const BUCKET_NAME = 'uploads';

function detectImageContentType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/**
 * POST /admin-api/upload
 *
 * Uploads a file to Supabase Storage. Accepts base64-encoded file data.
 *
 * Body: {
 *   file: string (base64-encoded file content),
 *   content_type: string (e.g., "image/jpeg"),
 *   folder?: string (e.g., "stores", "products", "drivers"),
 *   filename?: string (optional custom filename)
 * }
 *
 * Returns: { url: string, path: string }
 */
router.post('/upload', adminAuth, requireRole('super_admin', 'operations', 'content_manager'), express.json({ limit: '24mb' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { file, content_type, folder, filename } = req.body;

    if (!file || typeof file !== 'string') {
      throw new BadRequestError('Fichier requis (base64)', 'missing_file');
    }

    if (!content_type || !ALLOWED_TYPES[content_type]) {
      throw new BadRequestError(
        `Type de fichier non autorisé. Types acceptés : ${Object.keys(ALLOWED_TYPES).join(', ')}`,
        'invalid_content_type'
      );
    }

    // Decode base64
    const buffer = Buffer.from(file, 'base64');

    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestError(
        `Fichier trop volumineux. Taille maximale : ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        'file_too_large'
      );
    }

    if (buffer.length < 100) {
      throw new BadRequestError('Fichier trop petit ou invalide', 'file_too_small');
    }

    const detectedType = detectImageContentType(buffer);
    if (detectedType !== content_type) {
      throw new BadRequestError('Le contenu du fichier ne correspond pas au type declare', 'file_type_mismatch');
    }

    // Generate unique filename
    const ext = ALLOWED_TYPES[content_type];
    const uniqueId = crypto.randomBytes(12).toString('hex');
    const safeFolder = (folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    if (!ALLOWED_FOLDERS.has(safeFolder)) {
      throw new BadRequestError('Dossier de televersement non autorise', 'invalid_upload_folder');
    }
    const safeName = filename
      ? filename.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 50)
      : `${uniqueId}${ext}`;
    const storagePath = `${safeFolder}/${uniqueId}_${safeName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: content_type,
        upsert: false,
      });

    if (error) {
      logger.error('[upload] Supabase storage upload failed:', error.message);
      throw new InternalServerError('Échec du téléversement du fichier');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = urlData?.publicUrl || null;

    if (!publicUrl) {
      logger.error('[upload] Failed to generate public URL for:', storagePath);
      throw new InternalServerError('Échec de la génération de l\'URL publique');
    }

    logger.info(`[upload] File uploaded: ${storagePath} by admin ${req.admin?.email}`);
    void supabase.from('upload_audit_events').insert({
      admin_id: req.admin?.id || null,
      admin_email: req.admin?.email || null,
      folder: safeFolder,
      storage_path: storagePath,
      content_type,
      size_bytes: buffer.length,
      ip: req.ip || null,
      created_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) logger.warn('[upload] Audit insert failed', { message: error.message });
    });

    return res.status(201).json({
      ok: true,
      url: publicUrl,
      path: storagePath,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
