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

function normalizeTierRows(rows = []) {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => ({
      id: row?.id,
      cantidadMin: Number.parseInt(String(row?.cantidadMin ?? ''), 10),
      cantidadMax: Number.parseInt(String(row?.cantidadMax ?? ''), 10),
      tipoDescuento: String(row?.tipoDescuento || '').toUpperCase(),
      valor: toTwoDecimals(row?.valor),
    }))
    .filter((row) => Number.isInteger(row.cantidadMin)
      && Number.isInteger(row.cantidadMax)
      && row.cantidadMin > 0
      && row.cantidadMax >= row.cantidadMin
      && [TIPOS_DESCUENTO.PORCENTAJE, TIPOS_DESCUENTO.MONTO, TIPOS_DESCUENTO.PRECIO_FIJO].includes(row.tipoDescuento))
    .sort((left, right) => left.cantidadMin - right.cantidadMin);
}

function pickTierForQuantity(rows = [], quantity = 1) {
  const parsedQty = Math.max(1, Number.parseInt(String(quantity || 1), 10) || 1);

  return normalizeTierRows(rows).find((row) => parsedQty >= row.cantidadMin && parsedQty <= row.cantidadMax) || null;
}

export function resolveMayoreoPricing(basePrice, quantity = 1, descuentoRows = []) {
  const parsedBase = toTwoDecimals(basePrice);
  const parsedQty = Math.max(1, Number.parseInt(String(quantity || 1), 10) || 1);
  const tier = pickTierForQuantity(descuentoRows, parsedQty);

  if (!tier) {
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

  let unitPrice = parsedBase;

  if (tier.tipoDescuento === TIPOS_DESCUENTO.PORCENTAJE) {
    unitPrice = parsedBase - parsedBase * (toTwoDecimals(tier.valor) / 100);
  } else if (tier.tipoDescuento === TIPOS_DESCUENTO.MONTO) {
    unitPrice = parsedBase - toTwoDecimals(tier.valor);
  } else if (tier.tipoDescuento === TIPOS_DESCUENTO.PRECIO_FIJO) {
    unitPrice = toTwoDecimals(tier.valor);
  }

  unitPrice = Math.max(0, toTwoDecimals(unitPrice));
  const ahorroUnitario = Math.max(0, toTwoDecimals(parsedBase - unitPrice));

  return {
    basePrice: parsedBase,
    unitPrice,
    quantity: parsedQty,
    subtotal: toTwoDecimals(unitPrice * parsedQty),
    ahorroUnitario,
    ahorroTotal: toTwoDecimals(ahorroUnitario * parsedQty),
    descuentoAplicado: tier,
  };
}

export function formatTierLabel(row) {
  if (!row) return '';

  const min = Number(row.cantidadMin || 0);
  const max = Number(row.cantidadMax || 0);
  const value = toTwoDecimals(row.valor);

  if (row.tipoDescuento === TIPOS_DESCUENTO.PORCENTAJE) {
    return `${min}-${max}: ${value}% desc`;
  }

  if (row.tipoDescuento === TIPOS_DESCUENTO.MONTO) {
    return `${min}-${max}: -$${value.toFixed(2)} c/u`;
  }

  return `${min}-${max}: $${value.toFixed(2)} c/u`;
}

export function normalizeMayoreoRows(rows = []) {
  return normalizeTierRows(rows);
}
