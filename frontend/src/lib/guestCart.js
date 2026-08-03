import { resolveMayoreoPricing } from "./mayoreoPricing";

const GUEST_CART_KEY = "guest_cart_v1";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readStorage() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) {
      return { items: [] };
    }

    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.items) ? parsed : { items: [] };
  } catch (_error) {
    localStorage.removeItem(GUEST_CART_KEY);
    return { items: [] };
  }
}

function writeStorage(cart) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
}

function toCartResponse(cart) {
  const items = Array.isArray(cart.items) ? cart.items : [];
  const itemCount = items.reduce((acc, item) => acc + toNumber(item.quantity, 0), 0);
  const subtotal = items.reduce(
    (acc, item) => acc + toNumber(item.price, 0) * toNumber(item.quantity, 0),
    0
  );

  return {
    id: "guest",
    status: "active",
    items,
    itemCount,
    subtotal: Number(subtotal.toFixed(2)),
  };
}

function buildGuestItemFromProducto(producto, quantity = 1) {
  const productId = toNumber(producto?.id);
  const image = Array.isArray(producto?.imagenes) && producto.imagenes[0]?.url
    ? producto.imagenes[0].url
    : null;
  const descuentosMayoreo = Array.isArray(producto?.descuentosMayoreo) ? producto.descuentosMayoreo : [];
  const pricing = resolveMayoreoPricing(producto?.price, quantity, descuentosMayoreo);

  return {
    id: `guest-${productId}`,
    productId,
    quantity: Math.max(1, toNumber(quantity, 1)),
    price: pricing.unitPrice,
    basePrice: pricing.basePrice,
    subtotal: pricing.subtotal,
    descuentoAplicado: pricing.descuentoAplicado,
    ahorroTotal: pricing.ahorroTotal,
    producto: {
      id: productId,
      name: producto?.name || "Producto",
      price: toNumber(producto?.price, 0),
      stock: toNumber(producto?.stock, 0),
      status: Boolean(producto?.status ?? true),
      sku: producto?.sku || null,
      descuentosMayoreo,
      imagen: image,
    },
  };
}

export function getGuestCart() {
  return toCartResponse(readStorage());
}

export function getGuestCartCount() {
  return getGuestCart().itemCount;
}

export function addGuestItemFromProducto(producto, quantity = 1) {
  const cart = readStorage();
  const incoming = buildGuestItemFromProducto(producto, quantity);

  if (!incoming.productId) {
    return toCartResponse(cart);
  }

  const existingIndex = cart.items.findIndex((item) => item.productId === incoming.productId);

  if (existingIndex >= 0) {
    const current = cart.items[existingIndex];
    const maxStock = toNumber(current.producto?.stock, 999999);
    const nextQty = Math.min(maxStock, toNumber(current.quantity, 1) + toNumber(quantity, 1));
    const descuentos = Array.isArray(current.producto?.descuentosMayoreo)
      ? current.producto.descuentosMayoreo
      : incoming.producto?.descuentosMayoreo || [];
    const pricing = resolveMayoreoPricing(incoming.producto?.price, nextQty, descuentos);

    cart.items[existingIndex] = {
      ...current,
      quantity: Math.max(1, nextQty),
      price: pricing.unitPrice,
      basePrice: pricing.basePrice,
      subtotal: pricing.subtotal,
      descuentoAplicado: pricing.descuentoAplicado,
      ahorroTotal: pricing.ahorroTotal,
      producto: { ...current.producto, ...incoming.producto, descuentosMayoreo: descuentos },
    };
  } else {
    cart.items.push(incoming);
  }

  writeStorage(cart);
  return toCartResponse(cart);
}

export function updateGuestItem(itemId, quantity) {
  const cart = readStorage();
  const index = cart.items.findIndex((item) => item.id === itemId);

  if (index === -1) {
    return toCartResponse(cart);
  }

  const nextQty = Math.max(1, toNumber(quantity, 1));
  const maxStock = toNumber(cart.items[index]?.producto?.stock, 999999);
  const boundedQty = Math.min(nextQty, maxStock);
  const descuentos = Array.isArray(cart.items[index]?.producto?.descuentosMayoreo)
    ? cart.items[index].producto.descuentosMayoreo
    : [];
  const pricing = resolveMayoreoPricing(
    cart.items[index]?.producto?.price,
    boundedQty,
    descuentos
  );

  cart.items[index] = {
    ...cart.items[index],
    quantity: boundedQty,
    price: pricing.unitPrice,
    basePrice: pricing.basePrice,
    subtotal: pricing.subtotal,
    descuentoAplicado: pricing.descuentoAplicado,
    ahorroTotal: pricing.ahorroTotal,
  };

  writeStorage(cart);
  return toCartResponse(cart);
}

export function removeGuestItem(itemId) {
  const cart = readStorage();
  cart.items = cart.items.filter((item) => item.id !== itemId);
  writeStorage(cart);
  return toCartResponse(cart);
}

export function clearGuestCart() {
  const next = { items: [] };
  writeStorage(next);
  return toCartResponse(next);
}
