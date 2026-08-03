// src/models/index.js

const setupPermisosAssociations = require('./permiso.associations');

let db = {}; // cache singleton

function initModels(sequelize) {
  if (!sequelize) {
    console.error('❌ Sequelize UNDEFINED detectado');
    console.trace(); // 🔥 AQUÍ ESTÁ LA VERDAD
    throw new Error('Sequelize no inicializado correctamente');
  }

  if (Object.keys(db).length) {
    return db; // 👈 evita reinicializar
  }

  // =========================
  // MODELOS
  // =========================
  db.Administrador = require('./Administrador')(sequelize);
  db.Rol = require('./rol.model')(sequelize);
  db.Modulo = require('./modulo.model')(sequelize);
  db.Submodulo = require('./submodulo.model')(sequelize);
  db.Accion = require('./accion.model')(sequelize);
  db.RolModulo = require('./rolModulo.model')(sequelize);
  db.RolSubmodulo = require('./rolSubmodulo.model')(sequelize);
  db.RolAccion = require('./rolAccion.model')(sequelize);

  db.AdminRefreshToken = require('./AdminRefreshToken')(sequelize);
  db.AdminResetCode = require('./AdminResetCode')(sequelize);

  db.Categoria = require('./categoria.model')(sequelize);
  db.Producto = require('./producto.model')(sequelize);
  db.ProductoDescuento = require('./productoDescuento.model')(sequelize);
  db.Atributo = require('./atributo.model')(sequelize);
  db.AtributoValor = require('./atributoValor.model')(sequelize);
  db.ProductoAtributo = require('./productoAtributo.model')(sequelize);
  db.ProductoImagen = require('./productoImagen.model')(sequelize);
  db.ProductoOpinion = require('./productoOpinion.model')(sequelize);
  db.Banner = require('./banner.model')(sequelize);

  db.Usuario = require('./usuario.model')(sequelize);
  db.Cart = require('./cart.model')(sequelize);
  db.CartItem = require('./cartItem.model')(sequelize);

  db.Order = require('./order.model')(sequelize);
  db.OrderItem = require('./orderItem.model')(sequelize);

  db.Address = require('./address.model')(sequelize);
  db.EstadoMexico = require('./estadoMexico.model')(sequelize);
  db.Tarjeta = require('./tarjeta.model')(sequelize);
  db.Payment = require('./payment.model')(sequelize);
  db.Shipment = require('./shipment.model')(sequelize);

  db.Notification = require('./notification.model')(sequelize);
  db.UsuarioVerificationCode = require('./usuarioVerificationCode.model')(sequelize);

  // =========================
  // ASOCIACIONES
  // =========================

  const {
    Administrador,
    Rol,
    Modulo,
    Submodulo,
    Accion,
    RolModulo,
    RolSubmodulo,
    RolAccion,
    Categoria,
    Producto,
    ProductoDescuento,
    Atributo,
    AtributoValor,
    ProductoAtributo,
    ProductoImagen,
    ProductoOpinion,
    Usuario,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Address,
    EstadoMexico,
    Tarjeta,
    Payment,
    Shipment,
    Notification,
    UsuarioVerificationCode,
  } = db;

  // ADMIN
  Administrador.belongsTo(Rol, { foreignKey: 'ROL_ID', as: 'rol' });
  Rol.hasMany(Administrador, { foreignKey: 'ROL_ID', as: 'administradores' });

  // PERMISOS
  setupPermisosAssociations({
    Rol,
    Modulo,
    Submodulo,
    Accion,
    RolModulo,
    RolSubmodulo,
    RolAccion,
  });

  // CATEGORÍAS
  Producto.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
  Categoria.hasMany(Producto, { foreignKey: 'categoriaId', as: 'productos' });

  Producto.hasMany(ProductoDescuento, { foreignKey: 'productoId', as: 'descuentosMayoreo' });
  ProductoDescuento.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

  Atributo.hasMany(AtributoValor, { foreignKey: 'atributoId', as: 'valores' });
  AtributoValor.belongsTo(Atributo, { foreignKey: 'atributoId', as: 'atributo' });

  Producto.hasMany(ProductoAtributo, { foreignKey: 'productoId', as: 'atributosAsignaciones' });
  ProductoAtributo.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });
  ProductoAtributo.belongsTo(Atributo, { foreignKey: 'atributoId', as: 'atributo' });
  ProductoAtributo.belongsTo(AtributoValor, { foreignKey: 'valorId', as: 'valor' });

  Producto.hasMany(ProductoImagen, { foreignKey: 'productoId', as: 'imagenes' });
  ProductoImagen.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

  Producto.hasMany(ProductoOpinion, { foreignKey: 'productoId', as: 'opiniones' });
  ProductoOpinion.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

  Usuario.hasMany(ProductoOpinion, { foreignKey: 'userId', as: 'opiniones' });
  ProductoOpinion.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

  // CARRITO
  Usuario.hasMany(Cart, { foreignKey: 'userId', as: 'carts' });
  Cart.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

  Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
  CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });

  CartItem.belongsTo(Producto, { foreignKey: 'productId', as: 'producto' });

  // PEDIDOS
  Usuario.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
  Order.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

  Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
  OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  OrderItem.belongsTo(Producto, { foreignKey: 'productId', as: 'producto' });

  Order.belongsTo(Address, { foreignKey: 'shippingAddressId', as: 'shippingAddress' });

  // DIRECCIONES
  Usuario.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
  Address.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

  // TARJETAS / PAGOS
  Usuario.hasMany(Tarjeta, { foreignKey: 'userId', as: 'tarjetas' });
  Tarjeta.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

  Order.hasOne(Payment, { foreignKey: 'orderId', as: 'payment' });
  Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  Tarjeta.hasMany(Payment, { foreignKey: 'cardId', as: 'payments' });
  Payment.belongsTo(Tarjeta, { foreignKey: 'cardId', as: 'tarjeta' });

  // ENVÍOS
  Order.hasOne(Shipment, { foreignKey: 'orderId', as: 'shipment' });
  Shipment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  // NOTIFICACIONES
  Usuario.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  Notification.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

  // VERIFICACIÓN
  Usuario.hasMany(UsuarioVerificationCode, { foreignKey: 'userId', as: 'verificationCodes' });
  UsuarioVerificationCode.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

  db.sequelize = sequelize;

  return db;
}

module.exports = initModels;