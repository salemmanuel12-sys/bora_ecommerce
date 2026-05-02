const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const adminAuthRoutes = require('./modules/admin/admin.auth.routes');
const adminRolRoutes = require('./modules/adminRol/admin.rol.routes');
const adminPermisoRoutes = require('./modules/adminPermiso/permiso.routes');
const categoriaRoutes = require('./modules/categoria/categoria.routes');
const subcategoriaRoutes = require('./modules/subcategoria/subcategoria.routes');
const productoRoutes = require('./modules/producto/producto.routes');
const usuarioRoutes = require('./modules/usuarios/usuario.routes');
const adminUsuarioRoutes = require('./modules/usuarios/usuario.admin.routes');
const carritoRoutes = require('./modules/carrito/carrito.routes');
const pedidoRoutes = require('./modules/pedidos/pedido.routes');
const adminPedidoRoutes = require('./modules/pedidos/pedido.admin.routes');
const direccionRoutes = require('./modules/direcciones/direccion.routes');
const tarjetaRoutes = require('./modules/tarjetas/tarjeta.routes');
const pagoRoutes = require('./modules/pagos/pago.routes');
const envioRoutes = require('./modules/envios/envio.routes');
const notificacionRoutes = require('./modules/notificaciones/notificacion.routes');
const adminNotificacionRoutes = require('./modules/notificaciones/notificacion.admin.routes');
const productoOpinionRoutes = require('./modules/productoOpiniones/productoOpinion.routes');
const productoOpinionAdminRoutes = require('./modules/productoOpiniones/productoOpinion.admin.routes');
const bannerRoutes = require('./modules/banner/banner.routes');
const bannerPublicRoutes = require('./modules/banner/banner.public.routes');


const app = express();

const JSON_BODY_LIMIT = '2mb';
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5175',
];

const envOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins])];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: JSON_BODY_LIMIT }));
app.use('/uploads', (req, res, next) => {
  // Helmet sets CORP to same-origin by default; uploaded assets must be embeddable from the frontend origin.
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploadsImages'), {
  maxAge: '7d',
  etag: true,
  index: false,
}));
app.use('/uploads-banner', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads-banner', express.static(path.join(__dirname, '..', 'uploadsBanner'), {
  maxAge: '7d',
  etag: true,
  index: false,
}));
app.use('/admin/auth', adminAuthRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/admin/roles', adminRolRoutes);
app.use('/api/admin/roles', adminRolRoutes);
app.use('/admin/permisos', adminPermisoRoutes);
app.use('/api/admin/permisos', adminPermisoRoutes);
app.use('/admin/categorias', categoriaRoutes);
app.use('/api/admin/categorias', categoriaRoutes);
app.use('/admin/subcategorias', subcategoriaRoutes);
app.use('/api/admin/subcategorias', subcategoriaRoutes);
app.use('/admin/productos', productoRoutes);
app.use('/api/admin/productos', productoRoutes);
app.use('/catalogo/productos', productoRoutes);
app.use('/api/catalogo/productos', productoRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/admin/usuarios', adminUsuarioRoutes);
app.use('/api/anuncios/banners', bannerPublicRoutes);
app.use('/api/admin/anuncios/banners', bannerRoutes);

// ── Ecommerce (autenticados con JWT de usuario) ────────────
app.use('/api/carrito', carritoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/admin/pedidos', adminPedidoRoutes);
app.use('/api/direcciones', direccionRoutes);
app.use('/api/tarjetas', tarjetaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/envios', envioRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/admin/notificaciones', adminNotificacionRoutes);
app.use('/api/producto-opiniones', productoOpinionRoutes);
app.use('/api/admin/producto-opiniones', productoOpinionAdminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend corriendo correctamente',
  });
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada.',
  });
});

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Error interno del servidor.';

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    ok: false,
    message,
  });
});

module.exports = app;
