const { Cart, CartItem, Producto, ProductoImagen, ProductoDescuento } = require('../../models/loader');
const HttpError = require('../../utils/httpError');
const { resolveMayoreoPricing } = require('../../utils/productoDescuento.utils');

const includeProducto = {
  model: Producto,
  as: 'producto',
  attributes: ['id', 'name', 'price', 'stock', 'status', 'sku'],
  include: [
    {
      model: ProductoImagen,
      as: 'imagenes',
      attributes: ['id', 'url', 'orden'],
      required: false,
      order: [['orden', 'ASC']],
    },
    {
      model: ProductoDescuento,
      as: 'descuentosMayoreo',
      attributes: ['id', 'productoId', 'cantidadMin', 'cantidadMax', 'tipoDescuento', 'valor'],
      required: false,
    },
  ],
};

function computeCartItemPricing(item) {
  const producto = item?.producto || {};

  return resolveMayoreoPricing({
    basePrice: producto.price,
    quantity: item?.quantity,
    descuentos: Array.isArray(producto.descuentosMayoreo) ? producto.descuentosMayoreo : [],
  });
}

function toPublicItem(item) {
  const raw = item?.get ? item.get({ plain: true }) : item;
  const pricing = computeCartItemPricing(raw);

  return {
    id: raw.id,
    productId: raw.productId,
    quantity: raw.quantity,
    price: pricing.unitPrice,
    basePrice: pricing.basePrice,
    subtotal: pricing.subtotal,
    descuentoAplicado: pricing.descuentoAplicado,
    ahorroTotal: pricing.ahorroTotal,
    producto: raw.producto
      ? {
          id: raw.producto.id,
          name: raw.producto.name,
          price: Number(raw.producto.price),
          stock: raw.producto.stock,
          status: Boolean(raw.producto.status),
          sku: raw.producto.sku,
          descuentosMayoreo: Array.isArray(raw.producto.descuentosMayoreo)
            ? raw.producto.descuentosMayoreo
                .map((row) => ({
                  id: row.id,
                  productoId: row.productoId,
                  cantidadMin: Number(row.cantidadMin),
                  cantidadMax: Number(row.cantidadMax),
                  tipoDescuento: row.tipoDescuento,
                  valor: Number(row.valor),
                }))
                .sort((left, right) => left.cantidadMin - right.cantidadMin)
            : [],
          imagen: Array.isArray(raw.producto.imagenes) && raw.producto.imagenes.length > 0
            ? raw.producto.imagenes[0].url
            : null,
        }
      : null,
  };
}

async function syncCartItemPrices(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  let hasChanges = false;

  for (const item of items) {
    const pricing = computeCartItemPricing(item);
    const currentPrice = Number(item.price || 0);

    if (Math.abs(currentPrice - pricing.unitPrice) >= 0.01) {
      await item.update({ price: pricing.unitPrice });
      hasChanges = true;
    }
  }

  return hasChanges;
}

/**
 * Obtiene o crea el carrito activo del usuario.
 */
async function getOrCreateActiveCart(userId) {
  let cart = await Cart.findOne({
    where: { userId, status: 'Activo' },
    include: [{ model: CartItem, as: 'items', include: [includeProducto] }],
    order: [[{ model: CartItem, as: 'items' }, 'id', 'ASC']],
  });

  if (!cart) {
    cart = await Cart.create({ userId, status: 'Activo' });
    cart = await Cart.findByPk(cart.id, {
      include: [{ model: CartItem, as: 'items', include: [includeProducto] }],
    });
  }

  return cart;
}

/**
 * Retorna el carrito activo del usuario con sus items.
 */
async function getCart(userId) {
  let cart = await getOrCreateActiveCart(userId);
  const updated = await syncCartItemPrices(cart);

  if (updated) {
    cart = await Cart.findByPk(cart.id, {
      include: [{ model: CartItem, as: 'items', include: [includeProducto] }],
      order: [[{ model: CartItem, as: 'items' }, 'id', 'ASC']],
    });
  }

  const raw = cart.get({ plain: true });

  const items = (raw.items || []).map(toPublicItem);

  const subtotal = items.reduce(
    (acc, item) => acc + Number(item.subtotal || 0),
    0
  );

  return {
    id: raw.id,
    status: raw.status,
    createdAt: raw.createdAt,
    items,
    subtotal: Number(subtotal.toFixed(2)),
    itemCount: items.reduce((acc, item) => acc + item.quantity, 0),
  };
}

/**
 * Agrega un producto al carrito activo.
 * Si ya existe, incrementa la cantidad.
 */
async function addItem(userId, { productId, quantity = 1 }) {
  const parsedQty = Math.max(1, Number.parseInt(String(quantity), 10) || 1);

  const producto = await Producto.findByPk(productId, {
    include: [
      {
        model: ProductoDescuento,
        as: 'descuentosMayoreo',
        attributes: ['id', 'productoId', 'cantidadMin', 'cantidadMax', 'tipoDescuento', 'valor'],
        required: false,
      },
    ],
  });
  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado.');
  }
  if (!producto.status) {
    throw new HttpError(400, 'El producto no está disponible.');
  }
  if (producto.stock < parsedQty) {
    throw new HttpError(400, `Stock insuficiente. Disponible: ${producto.stock}.`);
  }

  const cart = await getOrCreateActiveCart(userId);

  const existing = await CartItem.findOne({
    where: { cartId: cart.id, productId },
  });

  if (existing) {
    const newQty = existing.quantity + parsedQty;
    if (producto.stock < newQty) {
      throw new HttpError(400, `Stock insuficiente para esa cantidad. Disponible: ${producto.stock}.`);
    }
    const pricing = resolveMayoreoPricing({
      basePrice: producto.price,
      quantity: newQty,
      descuentos: producto.descuentosMayoreo,
    });

    await existing.update({ quantity: newQty, price: pricing.unitPrice });
  } else {
    const pricing = resolveMayoreoPricing({
      basePrice: producto.price,
      quantity: parsedQty,
      descuentos: producto.descuentosMayoreo,
    });

    await CartItem.create({
      cartId: cart.id,
      productId,
      quantity: parsedQty,
      price: pricing.unitPrice,
    });
  }

  return getCart(userId);
}

/**
 * Actualiza la cantidad de un item del carrito.
 */
async function updateItem(userId, cartItemId, { quantity }) {
  const parsedQty = Math.max(1, Number.parseInt(String(quantity), 10) || 1);

  const cart = await Cart.findOne({ where: { userId, status: 'Activo' } });
  if (!cart) {
    throw new HttpError(404, 'No hay un carrito activo.');
  }

  const item = await CartItem.findOne({ where: { id: cartItemId, cartId: cart.id } });
  if (!item) {
    throw new HttpError(404, 'Item no encontrado en el carrito.');
  }

  const producto = await Producto.findByPk(item.productId, {
    include: [
      {
        model: ProductoDescuento,
        as: 'descuentosMayoreo',
        attributes: ['id', 'productoId', 'cantidadMin', 'cantidadMax', 'tipoDescuento', 'valor'],
        required: false,
      },
    ],
  });
  if (producto && producto.stock < parsedQty) {
    throw new HttpError(400, `Stock insuficiente. Disponible: ${producto.stock}.`);
  }

  const pricing = resolveMayoreoPricing({
    basePrice: producto?.price,
    quantity: parsedQty,
    descuentos: producto?.descuentosMayoreo,
  });

  await item.update({ quantity: parsedQty, price: pricing.unitPrice });
  return getCart(userId);
}

/**
 * Elimina un item del carrito.
 */
async function removeItem(userId, cartItemId) {
  const cart = await Cart.findOne({ where: { userId, status: 'Activo' } });
  if (!cart) {
    throw new HttpError(404, 'No hay un carrito activo.');
  }

  const item = await CartItem.findOne({ where: { id: cartItemId, cartId: cart.id } });
  if (!item) {
    throw new HttpError(404, 'Item no encontrado en el carrito.');
  }

  await item.destroy();
  return getCart(userId);
}

/**
 * Vacía todos los items del carrito activo.
 */
async function clearCart(userId) {
  const cart = await Cart.findOne({ where: { userId, status: 'Activo' } });
  if (!cart) {
    throw new HttpError(404, 'No hay un carrito activo.');
  }

  await CartItem.destroy({ where: { cartId: cart.id } });
  return getCart(userId);
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  getOrCreateActiveCart,
};
