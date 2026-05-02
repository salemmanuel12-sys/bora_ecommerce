const { Op } = require('sequelize');
const HttpError = require('../../utils/httpError');
const {
  sequelize,
  Rol,
  Modulo,
  Submodulo,
  Accion,
} = require('../../models');

const toAuditDate = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const toAuditTime = () => new Date().toTimeString().slice(0, 8).replace(/:/g, '');

function parsePositiveInt(value, fieldName = 'id') {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} invalido.`);
  }
  return parsed;
}

function sanitizeText(value = '', maxLength = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function validateEstado(estado) {
  const parsed = Number.parseInt(String(estado), 10);
  if (![0, 1].includes(parsed)) {
    throw new HttpError(400, 'Estado invalido. Usa 1 (activo) o 0 (inactivo).');
  }
  return parsed;
}

function normalizeIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new HttpError(400, `${fieldName} debe ser un arreglo.`);
  }

  const parsed = value.map((item) => Number.parseInt(String(item), 10));
  if (parsed.some((item) => !Number.isInteger(item) || item <= 0)) {
    throw new HttpError(400, `${fieldName} contiene ids invalidos.`);
  }

  return [...new Set(parsed)];
}

function ensureSuperAdmin(admin) {
  if (Number(admin?.rol) !== 1) {
    throw new HttpError(403, 'Solo el superadmin puede gestionar permisos.');
  }
}

function roleInclude() {
  return [
    {
      model: Modulo,
      as: 'modulos',
      through: { attributes: [] },
      required: false,
      where: { ESTADO: 1 },
      attributes: ['ID_MODULO', 'CODIGO', 'DESCRIPCION', 'ICONO', 'ORDEN'],
    },
    {
      model: Submodulo,
      as: 'submodulos',
      through: { attributes: [] },
      required: false,
      where: { ESTADO: 1 },
      attributes: ['ID_SUBMODULO', 'MODULO_ID', 'CODIGO', 'DESCRIPCION', 'ORDEN'],
    },
    {
      model: Accion,
      as: 'acciones',
      through: { attributes: [] },
      required: false,
      where: { ESTADO: 1 },
      attributes: ['ID_ACCION', 'SUBMODULO_ID', 'CODIGO', 'DESCRIPCION', 'ORDEN'],
    },
  ];
}

async function getPermisoCatalog() {
  const modulos = await Modulo.findAll({
    where: { ESTADO: 1 },
    attributes: ['ID_MODULO', 'CODIGO', 'DESCRIPCION', 'ICONO', 'ORDEN'],
    include: [
      {
        model: Submodulo,
        as: 'submodulos',
        required: false,
        where: { ESTADO: 1 },
        attributes: ['ID_SUBMODULO', 'MODULO_ID', 'CODIGO', 'DESCRIPCION', 'ORDEN'],
        include: [
          {
            model: Accion,
            as: 'acciones',
            required: false,
            where: { ESTADO: 1 },
            attributes: ['ID_ACCION', 'SUBMODULO_ID', 'CODIGO', 'DESCRIPCION', 'ORDEN'],
          },
        ],
      },
    ],
    order: [
      ['ORDEN', 'ASC'],
      ['ID_MODULO', 'ASC'],
      [{ model: Submodulo, as: 'submodulos' }, 'ORDEN', 'ASC'],
      [{ model: Submodulo, as: 'submodulos' }, 'ID_SUBMODULO', 'ASC'],
      [{ model: Submodulo, as: 'submodulos' }, { model: Accion, as: 'acciones' }, 'ORDEN', 'ASC'],
      [{ model: Submodulo, as: 'submodulos' }, { model: Accion, as: 'acciones' }, 'ID_ACCION', 'ASC'],
    ],
  });

  return modulos;
}

async function getRolePermisos(roleId) {
  const parsedRoleId = parsePositiveInt(roleId, 'roleId');

  const role = await Rol.findByPk(parsedRoleId, {
    attributes: ['ID_ROL', 'NOMBRE_ROL', 'DESCRIPCION', 'ESTADO'],
    include: roleInclude(),
  });

  if (!role) {
    throw new HttpError(404, 'Rol no encontrado.');
  }

  const plain = role.get({ plain: true });
  return {
    modulosAsignados: (plain.modulos || []).map((m) => m.ID_MODULO),
    submodulosAsignados: (plain.submodulos || []).map((s) => s.ID_SUBMODULO),
    accionesAsignadas: (plain.acciones || []).map((a) => a.ID_ACCION),
  };
}

async function replaceRolePermisos({ roleId, modulos, submodulos, acciones, admin }) {
  ensureSuperAdmin(admin);

  // Accept both uppercase and lowercase field names from the frontend
  const rawModulos = modulos !== undefined ? modulos : [];
  const rawSubmodulos = submodulos !== undefined ? submodulos : [];
  const rawAcciones = acciones !== undefined ? acciones : [];

  const parsedRoleId = parsePositiveInt(roleId, 'roleId');
  const moduloIds = normalizeIdArray(rawModulos, 'modulos');
  const submoduloIds = normalizeIdArray(rawSubmodulos, 'submodulos');
  const accionIds = normalizeIdArray(rawAcciones, 'acciones');

  const role = await Rol.findByPk(parsedRoleId);
  if (!role) {
    throw new HttpError(404, 'Rol no encontrado.');
  }

  const [foundModulos, foundSubmodulos, foundAcciones] = await Promise.all([
    moduloIds.length
      ? Modulo.findAll({ where: { ID_MODULO: { [Op.in]: moduloIds }, ESTADO: 1 } })
      : Promise.resolve([]),
    submoduloIds.length
      ? Submodulo.findAll({ where: { ID_SUBMODULO: { [Op.in]: submoduloIds }, ESTADO: 1 } })
      : Promise.resolve([]),
    accionIds.length
      ? Accion.findAll({ where: { ID_ACCION: { [Op.in]: accionIds }, ESTADO: 1 } })
      : Promise.resolve([]),
  ]);

  if (foundModulos.length !== moduloIds.length) {
    throw new HttpError(400, 'Uno o mas modulos no existen o estan inactivos.');
  }

  if (foundSubmodulos.length !== submoduloIds.length) {
    throw new HttpError(400, 'Uno o mas submodulos no existen o estan inactivos.');
  }

  if (foundAcciones.length !== accionIds.length) {
    throw new HttpError(400, 'Una o mas acciones no existen o estan inactivas.');
  }

  await sequelize.transaction(async (transaction) => {
    await role.setModulos(foundModulos, { transaction });
    await role.setSubmodulos(foundSubmodulos, { transaction });
    await role.setAcciones(foundAcciones, { transaction });
  });

  return getRolePermisos(parsedRoleId);
}

async function createModulo({ codigo, descripcion, icono, orden = 0, admin }) {
  ensureSuperAdmin(admin);

  const cleanCodigo = sanitizeText(codigo, 50).toUpperCase();
  const cleanDescripcion = sanitizeText(descripcion, 255);
  const cleanIcono = sanitizeText(icono || '', 100) || null;
  const parsedOrden = Number.parseInt(String(orden), 10);

  if (!cleanCodigo || cleanCodigo.length < 2) {
    throw new HttpError(400, 'CODIGO invalido.');
  }

  if (!cleanDescripcion || cleanDescripcion.length < 2) {
    throw new HttpError(400, 'DESCRIPCION invalida.');
  }

  const exists = await Modulo.findOne({ where: { CODIGO: cleanCodigo, ESTADO: 1 } });
  if (exists) {
    throw new HttpError(409, 'Ya existe un modulo con ese CODIGO.');
  }

  return Modulo.create({
    CODIGO: cleanCodigo,
    DESCRIPCION: cleanDescripcion,
    ICONO: cleanIcono,
    ORDEN: Number.isInteger(parsedOrden) ? parsedOrden : 0,
    ESTADO: 1,
    FEC_ALTA: toAuditDate(),
    HORA_ALTA: toAuditTime(),
    CVE_USUARIO_ALTA: String(admin.id || ''),
    DES_IP_ALTA: sanitizeText(admin.ipAddress || '', 45) || null,
  });
}

async function setModuloStatus({ moduloId, estado, motivo, admin }) {
  ensureSuperAdmin(admin);

  const parsedModuloId = parsePositiveInt(moduloId, 'moduloId');
  const parsedEstado = validateEstado(estado);

  const modulo = await Modulo.findByPk(parsedModuloId);
  if (!modulo) {
    throw new HttpError(404, 'Modulo no encontrado.');
  }

  const payload = { ESTADO: parsedEstado };
  if (parsedEstado === 0) {
    payload.FEC_BAJA = toAuditDate();
    payload.HORA_BAJA = toAuditTime();
    payload.CVE_USUARIO_BAJA = String(admin.id || '');
    payload.DES_IP_BAJA = sanitizeText(admin.ipAddress || '', 45) || null;
    payload.DES_MOTIVO_BAJA = sanitizeText(motivo || '', 100) || null;
  } else {
    payload.FEC_REACTIVA = toAuditDate();
    payload.HORA_REACTIVA = toAuditTime();
    payload.CVE_USUARIO_REACTIVA = String(admin.id || '');
    payload.DES_IP_REACTIVA = sanitizeText(admin.ipAddress || '', 45) || null;
    payload.DES_MOTIVO_REACTIVA = sanitizeText(motivo || '', 100) || null;
  }

  await modulo.update(payload);
  return modulo;
}

async function createSubmodulo({ moduloId, codigo, descripcion, orden = 0, admin }) {
  ensureSuperAdmin(admin);

  const parsedModuloId = parsePositiveInt(moduloId, 'moduloId');
  const cleanCodigo = sanitizeText(codigo, 80).toUpperCase();
  const cleanDescripcion = sanitizeText(descripcion, 255);
  const parsedOrden = Number.parseInt(String(orden), 10);

  if (!cleanCodigo || cleanCodigo.length < 2) {
    throw new HttpError(400, 'CODIGO invalido.');
  }

  if (!cleanDescripcion || cleanDescripcion.length < 2) {
    throw new HttpError(400, 'DESCRIPCION invalida.');
  }

  const modulo = await Modulo.findByPk(parsedModuloId);
  if (!modulo || Number(modulo.ESTADO) !== 1) {
    throw new HttpError(404, 'Modulo no encontrado o inactivo.');
  }

  const exists = await Submodulo.findOne({
    where: { MODULO_ID: parsedModuloId, CODIGO: cleanCodigo, ESTADO: 1 },
  });

  if (exists) {
    throw new HttpError(409, 'Ya existe un submodulo con ese CODIGO en el modulo.');
  }

  return Submodulo.create({
    MODULO_ID: parsedModuloId,
    CODIGO: cleanCodigo,
    DESCRIPCION: cleanDescripcion,
    ORDEN: Number.isInteger(parsedOrden) ? parsedOrden : 0,
    ESTADO: 1,
    FEC_ALTA: toAuditDate(),
    HORA_ALTA: toAuditTime(),
    CVE_USUARIO_ALTA: String(admin.id || ''),
    DES_IP_ALTA: sanitizeText(admin.ipAddress || '', 45) || null,
  });
}

async function setSubmoduloStatus({ submoduloId, estado, motivo, admin }) {
  ensureSuperAdmin(admin);

  const parsedSubmoduloId = parsePositiveInt(submoduloId, 'submoduloId');
  const parsedEstado = validateEstado(estado);

  const submodulo = await Submodulo.findByPk(parsedSubmoduloId);
  if (!submodulo) {
    throw new HttpError(404, 'Submodulo no encontrado.');
  }

  const payload = { ESTADO: parsedEstado };
  if (parsedEstado === 0) {
    payload.FEC_BAJA = toAuditDate();
    payload.HORA_BAJA = toAuditTime();
    payload.CVE_USUARIO_BAJA = String(admin.id || '');
    payload.DES_IP_BAJA = sanitizeText(admin.ipAddress || '', 45) || null;
    payload.DES_MOTIVO_BAJA = sanitizeText(motivo || '', 100) || null;
  } else {
    payload.FEC_REACTIVA = toAuditDate();
    payload.HORA_REACTIVA = toAuditTime();
    payload.CVE_USUARIO_REACTIVA = String(admin.id || '');
    payload.DES_IP_REACTIVA = sanitizeText(admin.ipAddress || '', 45) || null;
    payload.DES_MOTIVO_REACTIVA = sanitizeText(motivo || '', 100) || null;
  }

  await submodulo.update(payload);
  return submodulo;
}

async function createAccion({ submoduloId, codigo, descripcion, orden = 0, admin }) {
  ensureSuperAdmin(admin);

  const parsedSubmoduloId = parsePositiveInt(submoduloId, 'submoduloId');
  const cleanCodigo = sanitizeText(codigo, 80).toUpperCase();
  const cleanDescripcion = sanitizeText(descripcion, 255);
  const parsedOrden = Number.parseInt(String(orden), 10);

  if (!cleanCodigo || cleanCodigo.length < 2) {
    throw new HttpError(400, 'CODIGO invalido.');
  }

  if (!cleanDescripcion || cleanDescripcion.length < 2) {
    throw new HttpError(400, 'DESCRIPCION invalida.');
  }

  const submodulo = await Submodulo.findByPk(parsedSubmoduloId);
  if (!submodulo || Number(submodulo.ESTADO) !== 1) {
    throw new HttpError(404, 'Submodulo no encontrado o inactivo.');
  }

  const exists = await Accion.findOne({
    where: { SUBMODULO_ID: parsedSubmoduloId, CODIGO: cleanCodigo, ESTADO: 1 },
  });

  if (exists) {
    throw new HttpError(409, 'Ya existe una accion con ese CODIGO en el submodulo.');
  }

  return Accion.create({
    SUBMODULO_ID: parsedSubmoduloId,
    CODIGO: cleanCodigo,
    DESCRIPCION: cleanDescripcion,
    ORDEN: Number.isInteger(parsedOrden) ? parsedOrden : 0,
    ESTADO: 1,
    FEC_ALTA: toAuditDate(),
    HORA_ALTA: toAuditTime(),
    CVE_USUARIO_ALTA: String(admin.id || ''),
    DES_IP_ALTA: sanitizeText(admin.ipAddress || '', 45) || null,
  });
}

async function setAccionStatus({ accionId, estado, motivo, admin }) {
  ensureSuperAdmin(admin);

  const parsedAccionId = parsePositiveInt(accionId, 'accionId');
  const parsedEstado = validateEstado(estado);

  const accion = await Accion.findByPk(parsedAccionId);
  if (!accion) {
    throw new HttpError(404, 'Accion no encontrada.');
  }

  const payload = { ESTADO: parsedEstado };
  if (parsedEstado === 0) {
    payload.FEC_BAJA = toAuditDate();
    payload.HORA_BAJA = toAuditTime();
    payload.CVE_USUARIO_BAJA = String(admin.id || '');
    payload.DES_IP_BAJA = sanitizeText(admin.ipAddress || '', 45) || null;
    payload.DES_MOTIVO_BAJA = sanitizeText(motivo || '', 100) || null;
  } else {
    payload.FEC_REACTIVA = toAuditDate();
    payload.HORA_REACTIVA = toAuditTime();
    payload.CVE_USUARIO_REACTIVA = String(admin.id || '');
    payload.DES_IP_REACTIVA = sanitizeText(admin.ipAddress || '', 45) || null;
    payload.DES_MOTIVO_REACTIVA = sanitizeText(motivo || '', 100) || null;
  }

  await accion.update(payload);
  return accion;
}

module.exports = {
  getPermisoCatalog,
  getRolePermisos,
  replaceRolePermisos,
  createModulo,
  setModuloStatus,
  createSubmodulo,
  setSubmoduloStatus,
  createAccion,
  setAccionStatus,
  listModulos,
  updateModulo,
  listSubmodulos,
  updateSubmodulo,
  listAcciones,
  updateAccion,
};

// ── List / Update functions ──────────────────────────────────────────────────

async function listModulos({ page = 1, limit = 20, search = '', estado = 1 } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;
  const parsedEstado = Number.parseInt(String(estado), 10) === 0 ? 0 : 1;

  const where = { ESTADO: parsedEstado };
  if (search && String(search).trim()) {
    where[Op.or] = [
      { CODIGO: { [Op.like]: `%${String(search).trim().slice(0, 100)}%` } },
      { DESCRIPCION: { [Op.like]: `%${String(search).trim().slice(0, 100)}%` } },
    ];
  }

  const { count, rows } = await Modulo.findAndCountAll({
    where,
    attributes: ['ID_MODULO', 'CODIGO', 'DESCRIPCION', 'ICONO', 'ORDEN', 'ESTADO'],
    order: [['ORDEN', 'ASC'], ['ID_MODULO', 'ASC']],
    limit: parsedLimit,
    offset,
  });

  return {
    data: rows,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function updateModulo({ moduloId, codigo, descripcion, icono, orden, admin }) {
  ensureSuperAdmin(admin);

  const parsedId = parsePositiveInt(moduloId, 'moduloId');
  const cleanCodigo = sanitizeText(codigo || '', 50).toUpperCase();
  const cleanDescripcion = sanitizeText(descripcion || '', 255);
  const cleanIcono = sanitizeText(icono || '', 100) || null;
  const parsedOrden = orden !== undefined ? Number.parseInt(String(orden), 10) : undefined;

  const modulo = await Modulo.findByPk(parsedId);
  if (!modulo) throw new HttpError(404, 'Modulo no encontrado.');

  if (cleanCodigo && cleanCodigo.length >= 2) {
    const dup = await Modulo.findOne({ where: { CODIGO: cleanCodigo, ID_MODULO: { [Op.ne]: parsedId } } });
    if (dup) throw new HttpError(409, 'Ya existe un modulo con ese CODIGO.');
  }

  const payload = {};
  if (cleanCodigo && cleanCodigo.length >= 2) payload.CODIGO = cleanCodigo;
  if (cleanDescripcion) payload.DESCRIPCION = cleanDescripcion;
  if (icono !== undefined) payload.ICONO = cleanIcono;
  if (orden !== undefined && Number.isInteger(parsedOrden)) payload.ORDEN = parsedOrden;
  payload.FEC_ACTUALIZA = toAuditDate();
  payload.HORA_ACTUALIZA = toAuditTime();
  payload.CVE_USUARIO_ACTUALIZA = String(admin.id || '');
  payload.DES_IP_ACTUALIZA = sanitizeText(admin.ipAddress || '', 45) || null;

  await modulo.update(payload);
  return modulo;
}

async function listSubmodulos({ moduloId, estado = 1 } = {}) {
  const parsedModuloId = parsePositiveInt(moduloId, 'moduloId');
  const parsedEstado = Number.parseInt(String(estado), 10) === 0 ? 0 : 1;

  const rows = await Submodulo.findAll({
    where: { MODULO_ID: parsedModuloId, ESTADO: parsedEstado },
    attributes: ['ID_SUBMODULO', 'MODULO_ID', 'CODIGO', 'DESCRIPCION', 'ORDEN', 'ESTADO'],
    order: [['ORDEN', 'ASC'], ['ID_SUBMODULO', 'ASC']],
  });

  return { data: rows };
}

async function updateSubmodulo({ moduloId, submoduloId, codigo, descripcion, orden, admin }) {
  ensureSuperAdmin(admin);

  const parsedModuloId = parsePositiveInt(moduloId, 'moduloId');
  const parsedId = parsePositiveInt(submoduloId, 'submoduloId');
  const cleanCodigo = sanitizeText(codigo || '', 80).toUpperCase();
  const cleanDescripcion = sanitizeText(descripcion || '', 255);
  const parsedOrden = orden !== undefined ? Number.parseInt(String(orden), 10) : undefined;

  const submodulo = await Submodulo.findOne({ where: { ID_SUBMODULO: parsedId, MODULO_ID: parsedModuloId } });
  if (!submodulo) throw new HttpError(404, 'Submodulo no encontrado.');

  if (cleanCodigo && cleanCodigo.length >= 2) {
    const dup = await Submodulo.findOne({ where: { MODULO_ID: parsedModuloId, CODIGO: cleanCodigo, ID_SUBMODULO: { [Op.ne]: parsedId } } });
    if (dup) throw new HttpError(409, 'Ya existe un submodulo con ese CODIGO.');
  }

  const payload = {};
  if (cleanCodigo && cleanCodigo.length >= 2) payload.CODIGO = cleanCodigo;
  if (cleanDescripcion) payload.DESCRIPCION = cleanDescripcion;
  if (orden !== undefined && Number.isInteger(parsedOrden)) payload.ORDEN = parsedOrden;
  payload.FEC_ACTUALIZA = toAuditDate();
  payload.HORA_ACTUALIZA = toAuditTime();
  payload.CVE_USUARIO_ACTUALIZA = String(admin.id || '');
  payload.DES_IP_ACTUALIZA = sanitizeText(admin.ipAddress || '', 45) || null;

  await submodulo.update(payload);
  return submodulo;
}

async function listAcciones({ submoduloId, estado = 1 } = {}) {
  const parsedSubmoduloId = parsePositiveInt(submoduloId, 'submoduloId');
  const parsedEstado = Number.parseInt(String(estado), 10) === 0 ? 0 : 1;

  const rows = await Accion.findAll({
    where: { SUBMODULO_ID: parsedSubmoduloId, ESTADO: parsedEstado },
    attributes: ['ID_ACCION', 'SUBMODULO_ID', 'CODIGO', 'DESCRIPCION', 'ORDEN', 'ESTADO'],
    order: [['ORDEN', 'ASC'], ['ID_ACCION', 'ASC']],
  });

  return { data: rows };
}

async function updateAccion({ submoduloId, accionId, codigo, descripcion, orden, admin }) {
  ensureSuperAdmin(admin);

  const parsedSubmoduloId = parsePositiveInt(submoduloId, 'submoduloId');
  const parsedId = parsePositiveInt(accionId, 'accionId');
  const cleanCodigo = sanitizeText(codigo || '', 80).toUpperCase();
  const cleanDescripcion = sanitizeText(descripcion || '', 255);
  const parsedOrden = orden !== undefined ? Number.parseInt(String(orden), 10) : undefined;

  const accion = await Accion.findOne({ where: { ID_ACCION: parsedId, SUBMODULO_ID: parsedSubmoduloId } });
  if (!accion) throw new HttpError(404, 'Accion no encontrada.');

  if (cleanCodigo && cleanCodigo.length >= 2) {
    const dup = await Accion.findOne({ where: { SUBMODULO_ID: parsedSubmoduloId, CODIGO: cleanCodigo, ID_ACCION: { [Op.ne]: parsedId } } });
    if (dup) throw new HttpError(409, 'Ya existe una accion con ese CODIGO.');
  }

  const payload = {};
  if (cleanCodigo && cleanCodigo.length >= 2) payload.CODIGO = cleanCodigo;
  if (cleanDescripcion) payload.DESCRIPCION = cleanDescripcion;
  if (orden !== undefined && Number.isInteger(parsedOrden)) payload.ORDEN = parsedOrden;
  payload.FEC_ACTUALIZA = toAuditDate();
  payload.HORA_ACTUALIZA = toAuditTime();
  payload.CVE_USUARIO_ACTUALIZA = String(admin.id || '');
  payload.DES_IP_ACTUALIZA = sanitizeText(admin.ipAddress || '', 45) || null;

  await accion.update(payload);
  return accion;
}
