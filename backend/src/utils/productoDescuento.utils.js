const TIPOS_DESCUENTO = Object.freeze({
  PORCENTAJE: 'PORCENTAJE',
  MONTO: 'MONTO',
  PRECIO_FIJO: 'PRECIO_FIJO',
});

function toTwoDecimals(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

function normalizeTipoDescuento(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === TIPOS_DESCUENTO.PORCENTAJE) return TIPOS_DESCUENTO.PORCENTAJE;
  if (normalized === TIPOS_DESCUENTO.MONTO) return TIPOS_DESCUENTO.MONTO;
  if (normalized === TIPOS_DESCUENTO.PRECIO_FIJO) return TIPOS_DESCUENTO.PRECIO_FIJO;
  return null;
}

function normalizeDescuentosMayoreoInput(input, { allowEmpty = true } = {}) {
  if (input === undefined || input === null || input === '') {
    return [];
  }

  let parsed = input;

  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch (_error) {
      return null;
    }
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  const normalized = [];

  for (const row of parsed) {
    const cantidadMin = Number.parseInt(String(row?.cantidadMin ?? ''), 10);
    const cantidadMax = Number.parseInt(String(row?.cantidadMax ?? ''), 10);
    const tipoDescuento = normalizeTipoDescuento(row?.tipoDescuento);
    const valor = toTwoDecimals(row?.valor);

    if (!Number.isInteger(cantidadMin) || !Number.isInteger(cantidadMax) || !tipoDescuento) {
      return null;
    }

    if (cantidadMin <= 0 || cantidadMax <= 0 || cantidadMin > cantidadMax) {
      return null;
    }

    if (!Number.isFinite(valor) || valor < 0) {
      return null;
    }

    if (tipoDescuento === TIPOS_DESCUENTO.PORCENTAJE && (valor <= 0 || valor > 100)) {
      return null;
    }

    if (tipoDescuento === TIPOS_DESCUENTO.MONTO && valor <= 0) {
      return null;
    }

    normalized.push({
      cantidadMin,
      cantidadMax,
      tipoDescuento,
      valor,
    });
  }

  if (!allowEmpty && normalized.length === 0) {
    return null;
  }

  normalized.sort((left, right) => {
    if (left.cantidadMin !== right.cantidadMin) {
      return left.cantidadMin - right.cantidadMin;
    }

    if (left.cantidadMax !== right.cantidadMax) {
      return left.cantidadMax - right.cantidadMax;
    }

    return left.tipoDescuento.localeCompare(right.tipoDescuento);
  });

  for (let index = 1; index < normalized.length; index += 1) {
    const prev = normalized[index - 1];
    const current = normalized[index];

    if (current.cantidadMin <= prev.cantidadMax) {
      return null;
    }
  }

  return normalized;
}

function sortDescuentos(rows = []) {
  return [...rows].sort((left, right) => {
    if (left.cantidadMin !== right.cantidadMin) {
      return Number(left.cantidadMin) - Number(right.cantidadMin);
    }

    if (left.cantidadMax !== right.cantidadMax) {
      return Number(left.cantidadMax) - Number(right.cantidadMax);
    }

    return String(left.tipoDescuento || '').localeCompare(String(right.tipoDescuento || ''));
  });
}

function mapDescuentoPublic(row) {
  const item = row?.get ? row.get({ plain: true }) : row;

  return {
    id: item.id,
    productoId: item.productoId,
    cantidadMin: Number(item.cantidadMin),
    cantidadMax: Number(item.cantidadMax),
    tipoDescuento: normalizeTipoDescuento(item.tipoDescuento) || item.tipoDescuento,
    valor: toTwoDecimals(item.valor),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function pickDescuentoForQuantity(descuentos = [], quantity = 1) {
  const parsedQty = Number.parseInt(String(quantity || 1), 10);
  if (!Number.isInteger(parsedQty) || parsedQty <= 0) return null;

  const sorted = sortDescuentos(descuentos);

  return sorted.find((row) => {
    const min = Number.parseInt(String(row?.cantidadMin || ''), 10);
    const max = Number.parseInt(String(row?.cantidadMax || ''), 10);
    if (!Number.isInteger(min) || !Number.isInteger(max)) return false;
    return parsedQty >= min && parsedQty <= max;
  }) || null;
}

function resolveMayoreoPricing({ basePrice, quantity, descuentos = [] }) {
  const parsedBase = toTwoDecimals(basePrice);
  const parsedQty = Math.max(1, Number.parseInt(String(quantity || 1), 10) || 1);

  const selected = pickDescuentoForQuantity(descuentos, parsedQty);
  if (!selected) {
    return {
      basePrice: parsedBase,
      unitPrice: parsedBase,
      quantity: parsedQty,
      subtotal: toTwoDecimals(parsedBase * parsedQty),
      ahorroUnitario: 0,
      ahorroTotal: 0,
      descuentoAplicado: null,
    };
  }

  const tipo = normalizeTipoDescuento(selected.tipoDescuento);
  const valor = toTwoDecimals(selected.valor);

  let unitPrice = parsedBase;

  if (tipo === TIPOS_DESCUENTO.PORCENTAJE) {
    unitPrice = parsedBase - (parsedBase * (valor / 100));
  } else if (tipo === TIPOS_DESCUENTO.MONTO) {
    unitPrice = parsedBase - valor;
  } else if (tipo === TIPOS_DESCUENTO.PRECIO_FIJO) {
    unitPrice = valor;
  }

  unitPrice = Math.max(0, toTwoDecimals(unitPrice));

  const ahorroUnitario = Math.max(0, toTwoDecimals(parsedBase - unitPrice));
  const ahorroTotal = toTwoDecimals(ahorroUnitario * parsedQty);

  return {
    basePrice: parsedBase,
    unitPrice,
    quantity: parsedQty,
    subtotal: toTwoDecimals(unitPrice * parsedQty),
    ahorroUnitario,
    ahorroTotal,
    descuentoAplicado: {
      id: selected.id,
      cantidadMin: Number(selected.cantidadMin),
      cantidadMax: Number(selected.cantidadMax),
      tipoDescuento: tipo,
      valor,
    },
  };
}

module.exports = {
  TIPOS_DESCUENTO,
  mapDescuentoPublic,
  normalizeDescuentosMayoreoInput,
  pickDescuentoForQuantity,
  resolveMayoreoPricing,
  toTwoDecimals,
};
