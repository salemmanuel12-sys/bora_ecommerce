const HttpError = require('../utils/httpError');

function sanitizeText(value = '', maxLength = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function parsePositiveInt(value) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ── Param validators ────────────────────────────────────────────────────────

function validateRoleIdParam(req, _res, next) {
  const id = parsePositiveInt(req.params?.roleId);
  if (!id) return next(new HttpError(400, 'Id de rol invalido.'));
  req.params.roleId = String(id);
  return next();
}

function validateModuloIdParam(req, _res, next) {
  const id = parsePositiveInt(req.params?.moduloId);
  if (!id) return next(new HttpError(400, 'Id de modulo invalido.'));
  req.params.moduloId = String(id);
  return next();
}

function validateSubmoduloIdParam(req, _res, next) {
  const id = parsePositiveInt(req.params?.submoduloId);
  if (!id) return next(new HttpError(400, 'Id de submodulo invalido.'));
  req.params.submoduloId = String(id);
  return next();
}

function validateAccionIdParam(req, _res, next) {
  const id = parsePositiveInt(req.params?.accionId);
  if (!id) return next(new HttpError(400, 'Id de accion invalido.'));
  req.params.accionId = String(id);
  return next();
}

// ── Body validators ──────────────────────────────────────────────────────────

function validateRolePermisos(req, _res, next) {
  const body = req.body || {};

  function parseIdArray(field) {
    const raw = body[field];
    if (raw === undefined || raw === null) return [];
    if (!Array.isArray(raw)) {
      return null; // signal error
    }
    if (raw.length > 500) return null;
    const parsed = raw.map((v) => parsePositiveInt(v));
    if (parsed.some((v) => v === null)) return null;
    return parsed;
  }

  const modulos = parseIdArray('modulos');
  const submodulos = parseIdArray('submodulos');
  const acciones = parseIdArray('acciones');

  if (modulos === null) {
    return next(new HttpError(400, '"modulos" debe ser un arreglo de enteros positivos (max 500).'));
  }
  if (submodulos === null) {
    return next(new HttpError(400, '"submodulos" debe ser un arreglo de enteros positivos (max 500).'));
  }
  if (acciones === null) {
    return next(new HttpError(400, '"acciones" debe ser un arreglo de enteros positivos (max 500).'));
  }

  req.body.modulos = modulos;
  req.body.submodulos = submodulos;
  req.body.acciones = acciones;

  return next();
}

function validateCreateModulo(req, _res, next) {
  const codigo = sanitizeText(req.body?.codigo || req.body?.CODIGO || '', 50);
  const descripcion = sanitizeText(req.body?.descripcion || req.body?.DESCRIPCION || '', 100);
  const icono = sanitizeText(req.body?.icono || req.body?.ICONO || '', 100) || null;
  const ordenRaw = req.body?.orden ?? req.body?.ORDEN;
  const orden = ordenRaw !== undefined ? parsePositiveInt(ordenRaw) : null;

  if (!codigo || codigo.length < 2) {
    return next(new HttpError(400, 'El codigo del modulo es obligatorio y debe tener al menos 2 caracteres.'));
  }
  if (!descripcion) {
    return next(new HttpError(400, 'La descripcion del modulo es obligatoria.'));
  }
  if (ordenRaw !== undefined && orden === null) {
    return next(new HttpError(400, 'El campo orden debe ser un entero positivo.'));
  }

  req.body.codigo = codigo;
  req.body.descripcion = descripcion;
  req.body.icono = icono;
  req.body.orden = orden;

  return next();
}

function validateCreateSubmodulo(req, _res, next) {
  const codigo = sanitizeText(req.body?.codigo || req.body?.CODIGO || '', 80);
  const descripcion = sanitizeText(req.body?.descripcion || req.body?.DESCRIPCION || '', 150);
  const ordenRaw = req.body?.orden ?? req.body?.ORDEN;
  const orden = ordenRaw !== undefined ? parsePositiveInt(ordenRaw) : null;

  if (!codigo || codigo.length < 2) {
    return next(new HttpError(400, 'El codigo del submodulo es obligatorio y debe tener al menos 2 caracteres.'));
  }
  if (!descripcion) {
    return next(new HttpError(400, 'La descripcion del submodulo es obligatoria.'));
  }
  if (ordenRaw !== undefined && orden === null) {
    return next(new HttpError(400, 'El campo orden debe ser un entero positivo.'));
  }

  req.body.codigo = codigo;
  req.body.descripcion = descripcion;
  req.body.orden = orden;

  return next();
}

function validateCreateAccion(req, _res, next) {
  const codigo = sanitizeText(req.body?.codigo || req.body?.CODIGO || '', 80);
  const descripcion = sanitizeText(req.body?.descripcion || req.body?.DESCRIPCION || '', 150);

  if (!codigo || codigo.length < 2) {
    return next(new HttpError(400, 'El codigo de la accion es obligatorio y debe tener al menos 2 caracteres.'));
  }
  if (!descripcion) {
    return next(new HttpError(400, 'La descripcion de la accion es obligatoria.'));
  }

  req.body.codigo = codigo;
  req.body.descripcion = descripcion;

  return next();
}

function validatePermisoStatus(req, _res, next) {
  const estadoRaw = req.body?.estado;
  const estado = Number.parseInt(String(estadoRaw ?? ''), 10);

  if (![0, 1].includes(estado)) {
    return next(new HttpError(400, 'Estado invalido. Usa 1 (activo) o 0 (inactivo).'));
  }

  const motivo = sanitizeText(req.body?.motivo || '', 150) || null;

  req.body.estado = estado;
  req.body.motivo = motivo;

  return next();
}

module.exports = {
  validateRoleIdParam,
  validateModuloIdParam,
  validateSubmoduloIdParam,
  validateAccionIdParam,
  validateRolePermisos,
  validateCreateModulo,
  validateCreateSubmodulo,
  validateCreateAccion,
  validatePermisoStatus,
};
