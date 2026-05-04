const { sequelize } = require('../config/db').sequelize;
const setupPermisosAssociations = require('./permiso.associations');

const Administrador = require('./Administrador')(sequelize);
const Rol = require('./rol.model')(sequelize);
const Modulo = require('./modulo.model')(sequelize);
const Submodulo = require('./submodulo.model')(sequelize);
const Accion = require('./accion.model')(sequelize);
const RolModulo = require('./rolModulo.model')(sequelize);
const RolSubmodulo = require('./rolSubmodulo.model')(sequelize);
const RolAccion = require('./rolAccion.model')(sequelize);
const AdminRefreshToken = require('./AdminRefreshToken')(sequelize);
const AdminResetCode = require('./AdminResetCode')(sequelize);
const Categoria = require('./categoria.model')(sequelize);
const Subcategoria = require('./subcategoria.model')(sequelize);
const Producto = require('./producto.model')(sequelize);
const ProductoImagen = require('./productoImagen.model')(sequelize);
const ProductoOpinion = require('./productoOpinion.model')(sequelize);
const Banner = require('./banner.model')(sequelize);
const Usuario = require('./usuario.model')(sequelize);
const Cart = require('./cart.model')(sequelize);
const CartItem = require('./cartItem.model')(sequelize);
const Order = require('./order.model')(sequelize);
const OrderItem = require('./orderItem.model')(sequelize);
const Address = require('./address.model')(sequelize);
const Tarjeta = require('./tarjeta.model')(sequelize);
const Payment = require('./payment.model')(sequelize);
const Shipment = require('./shipment.model')(sequelize);
const Notification = require('./notification.model')(sequelize);
const UsuarioVerificationCode = require('./usuarioVerificationCode.model')(sequelize);

console.log('SEQUELIZE EN MODELS:', sequelize);

Administrador.belongsTo(Rol, {
  foreignKey: 'ROL_ID',
  targetKey: 'ID_ROL',
  as: 'rol',
});

Rol.hasMany(Administrador, {
  foreignKey: 'ROL_ID',
  sourceKey: 'ID_ROL',
  as: 'administradores',
});

Administrador.hasMany(AdminRefreshToken, {
  foreignKey: 'adminId',
  sourceKey: 'NUM_ADMIN',
  as: 'refreshTokens',
});

AdminRefreshToken.belongsTo(Administrador, {
  foreignKey: 'adminId',
  targetKey: 'NUM_ADMIN',
  as: 'admin',
});

Administrador.hasMany(AdminResetCode, {
  foreignKey: 'adminId',
  sourceKey: 'NUM_ADMIN',
  as: 'resetCodes',
});

AdminResetCode.belongsTo(Administrador, {
  foreignKey: 'adminId',
  targetKey: 'NUM_ADMIN',
  as: 'admin',
});

Subcategoria.belongsTo(Categoria, {
  foreignKey: 'categoriaId',
  targetKey: 'id',
  as: 'categoria',
});

Categoria.hasMany(Subcategoria, {
  foreignKey: 'categoriaId',
  sourceKey: 'id',
  as: 'subcategorias',
});

Producto.belongsTo(Subcategoria, {
  foreignKey: 'subcategoriaId',
  targetKey: 'id',
  as: 'subcategoria',
});

Subcategoria.hasMany(Producto, {
  foreignKey: 'subcategoriaId',
  sourceKey: 'id',
  as: 'productos',
});

ProductoImagen.belongsTo(Producto, {
  foreignKey: 'productoId',
  targetKey: 'id',
  as: 'producto',
});

Producto.hasMany(ProductoImagen, {
  foreignKey: 'productoId',
  sourceKey: 'id',
  as: 'imagenes',
});

ProductoOpinion.belongsTo(Producto, {
  foreignKey: 'productoId',
  targetKey: 'id',
  as: 'producto',
});

Producto.hasMany(ProductoOpinion, {
  foreignKey: 'productoId',
  sourceKey: 'id',
  as: 'opiniones',
});

setupPermisosAssociations({
  Rol,
  Modulo,
  Submodulo,
  Accion,
  RolModulo,
  RolSubmodulo,
  RolAccion,
});

// ── Carrito ──────────────────────────────────────────────
Usuario.hasMany(Cart, { foreignKey: 'userId', as: 'carts' });
Cart.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });

CartItem.belongsTo(Producto, { foreignKey: 'productId', as: 'producto' });
Producto.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems' });

// ── Pedidos ───────────────────────────────────────────────
Usuario.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

OrderItem.belongsTo(Producto, { foreignKey: 'productId', as: 'producto' });
Producto.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });

Order.belongsTo(Address, { foreignKey: 'shippingAddressId', as: 'shippingAddress' });

// ── Direcciones ───────────────────────────────────────────
Usuario.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

// ── Opiniones de producto ─────────────────────────────────
Usuario.hasMany(ProductoOpinion, { foreignKey: 'userId', as: 'opinionesProducto' });
ProductoOpinion.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

// ── Tarjetas ───────────────────────────────────────────────
Usuario.hasMany(Tarjeta, { foreignKey: 'userId', as: 'tarjetas' });
Tarjeta.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

// ── Pagos ─────────────────────────────────────────────────
Order.hasOne(Payment, { foreignKey: 'orderId', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Tarjeta.hasMany(Payment, { foreignKey: 'cardId', as: 'payments' });
Payment.belongsTo(Tarjeta, { foreignKey: 'cardId', as: 'tarjeta' });

// ── Envíos ────────────────────────────────────────────────
Order.hasOne(Shipment, { foreignKey: 'orderId', as: 'shipment' });
Shipment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// ── Notificaciones ────────────────────────────────────────
Usuario.hasMany(Notification, {
  foreignKey: { name: 'userId', allowNull: true },
  as: 'notifications',
});
Notification.belongsTo(Usuario, {
  foreignKey: { name: 'userId', allowNull: true },
  as: 'usuario',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// ── Verificación de email de usuario ──────────────────────
Usuario.hasMany(UsuarioVerificationCode, { foreignKey: 'userId', as: 'verificationCodes' });
UsuarioVerificationCode.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

module.exports = {
  sequelize,
  Administrador,
  AdminRefreshToken,
  AdminResetCode,
  Rol,
  Modulo,
  Submodulo,
  Accion,
  RolModulo,
  RolSubmodulo,
  RolAccion,
  Categoria,
  Subcategoria,
  Producto,
  ProductoImagen,
  ProductoOpinion,
  Banner,
  Usuario,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Address,
  Tarjeta,
  Payment,
  Shipment,
  Notification,
  UsuarioVerificationCode,
};
