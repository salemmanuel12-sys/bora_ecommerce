const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const HttpError = require('../utils/httpError');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_FILES = 10;
const MAX_BANNER_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploadsImages', 'productos');
const BANNER_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploadsBanner');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(BANNER_UPLOAD_DIR)) {
  fs.mkdirSync(BANNER_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const originalBase = path.basename(file.originalname);

  // Rechazar path traversal o nombres con directorios
  if (originalBase !== file.originalname || file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return cb(new HttpError(400, 'Nombre de archivo invalido.'));
  }

  // Rechazar doble extension (ej: image.php.jpg)
  const parts = originalBase.split('.');
  if (parts.length > 2) {
    return cb(new HttpError(400, 'El archivo no puede tener multiples extensiones.'));
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new HttpError(400, 'Solo se permiten imagenes JPEG, PNG o WebP.'));
  }

  cb(null, true);
}

const _multerUpload = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: MAX_FILES,
  },
  fileFilter,
}).array('imagenes', MAX_FILES);

const _multerBannerUpload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, BANNER_UPLOAD_DIR);
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${crypto.randomUUID()}-${Date.now()}${ext}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: MAX_BANNER_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
}).single('imagen');

/**
 * Middleware que procesa el upload de imagenes de producto.
 * Convierte los errores de multer en HttpError estándar.
 */
function handleUploadProductoImagenes(req, res, next) {
  _multerUpload(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new HttpError(400, 'Cada imagen no puede superar 2 MB.'));
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new HttpError(400, `Se permiten un maximo de ${MAX_FILES} imagenes por carga.`));
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new HttpError(400, 'Campo de archivo inesperado. Usa el campo "imagenes".'));
    }

    if (err instanceof HttpError) {
      return next(err);
    }

    return next(new HttpError(400, 'Error al procesar el archivo.'));
  });
}

function handleUploadBannerImagen(req, res, next) {
  _multerBannerUpload(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new HttpError(400, 'La imagen del banner no puede superar 8 MB.'));
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new HttpError(400, 'Solo se permite una imagen por banner.'));
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new HttpError(400, 'Campo de archivo inesperado. Usa el campo "imagen".'));
    }

    if (err instanceof HttpError) {
      return next(err);
    }

    return next(new HttpError(400, 'Error al procesar la imagen del banner.'));
  });
}

module.exports = { handleUploadProductoImagenes, handleUploadBannerImagen };
