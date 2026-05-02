import { Navigate, Route, Routes } from "react-router-dom";
import AdminDashboardLayout from "./components/AdminDashboardLayout";
import AdminPrivateRoute from "./components/AdminPrivateRoute";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/administrador/AdminDashboard";
import AdminSessions from "./pages/administrador/AdminSessions";
import AdminRol from "./pages/administrador/adminRol/AdminRol";
import GestionPermisos from "./pages/administrador/gestionPermisos/GestionPermisos";
import AdminAdmins from "./pages/administrador/AdminAdmins";
import AdminManagement from "./pages/administrador/gestionAdministradores/AdminManagement";
import AdminInvite from "./pages/administrador/gestionAdministradores/AdminInvite";
import AdminPasswordChanges from "./pages/administrador/gestionAdministradores/AdminPasswordChanges";
import AdminCatalogos from "./pages/administrador/catalogos/AdminCatalogos";
import AdminCategorias from "./pages/administrador/catalogos/AdminCategorias";
import AdminSubcategorias from "./pages/administrador/catalogos/AdminSubcategorias";
import AdminProductos from "./pages/administrador/catalogos/AdminProductos";
import AdminPedidos from "./pages/administrador/pedidos/AdminPedidos";
import AdminPedidosListado from "./pages/administrador/pedidos/AdminPedidosListado";
import AdminGestionUsuarios from "./pages/administrador/gestionUsuarios/AdminGestionUsuarios";
import AdminUsuarios from "./pages/administrador/gestionUsuarios/AdminUsuarios";
import AdminOpinionesModeracion from "./pages/administrador/gestionUsuarios/AdminOpinionesModeracion";
import AdminAnuncios from "./pages/administrador/anuncios/AdminAnuncios";
import AdminBanners from "./pages/administrador/anuncios/AdminBanners";
import AdminRegister from "./pages/administrador/adminLogin/AdminRegister";
import AdminVerifyEmail from "./pages/administrador/adminLogin/AdminVerifyEmail";
import AdminForgotPassword from "./pages/administrador/adminLogin/AdminForgotPassword";
import UsuarioForgotPassword from "./pages/usuarios/UsuarioForgotPassword";
import UsuarioLogin from "./pages/usuarios/UsuarioLogin";
import UsuarioRegister from "./pages/usuarios/UsuarioRegister";
import UsuarioVerifyEmail from "./pages/usuarios/UsuarioVerifyEmail";
import UsuariosHome from "./pages/usuarios/UsuariosHome";
import Nosotros from "./pages/usuarios/Nosotros";
import Contacto from "./pages/usuarios/Contacto";
import Carrito from "./pages/usuarios/Carrito";
import UsuariosHomeSesion from "./pages/usuarios/UsuariosHomeSesion";
import UsuarioPedidos from "./pages/usuarios/UsuarioPedidos";
import UsuarioDirecciones from "./pages/usuarios/UsuarioDirecciones";
import UsuarioPagos from "./pages/usuarios/UsuarioPagos";
import ProductoDetalle from "./pages/usuarios/ProductoDetalle";

function App() {
  return (
    <Routes>
      <Route path="/" element={<UsuariosHome />} />
      <Route path="/nosotros" element={<Nosotros />} />
      <Route path="/contacto" element={<Contacto />} />
      <Route path="/producto/:productoId" element={<ProductoDetalle />} />
      <Route path="/carrito" element={<Carrito />} />
      <Route path="/user" element={<UsuarioLogin />} />
      <Route
        path="/usuarios/home-sesion"
        element={
          <PrivateRoute>
            <UsuariosHomeSesion />
          </PrivateRoute>
        }
      />
      <Route
        path="/usuarios/pedidos"
        element={
          <PrivateRoute>
            <UsuarioPedidos />
          </PrivateRoute>
        }
      />
      <Route
        path="/usuarios/pedidos/:orderId"
        element={
          <PrivateRoute>
            <UsuarioPedidos />
          </PrivateRoute>
        }
      />
      <Route
        path="/usuarios/direcciones"
        element={
          <PrivateRoute>
            <UsuarioDirecciones />
          </PrivateRoute>
        }
      />
      <Route
        path="/usuarios/pagos"
        element={
          <PrivateRoute>
            <UsuarioPagos />
          </PrivateRoute>
        }
      />
      
      <Route path="/administradores_bora" element={<Login />} />
      <Route path="/usuarios/registro" element={<UsuarioRegister />} />
      <Route path="/usuarios/verificar-email" element={<UsuarioVerifyEmail />} />
      <Route path="/usuarios/forgot-password" element={<UsuarioForgotPassword />} />
      <Route path="/admin/register/:token" element={<AdminRegister />} />
      <Route path="/admin/verify-email" element={<AdminVerifyEmail />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />

      <Route
        path="/admin"
        element={
          <AdminPrivateRoute>
            <AdminDashboardLayout />
          </AdminPrivateRoute>
        }
      >
        <Route index element={<Navigate to="gestion-administradores" replace />} />
        <Route path="gestion-administradores" element={<AdminAdmins />} />
        <Route path="gestion-administradores/manage" element={<AdminManagement />} />
        <Route path="gestion-administradores/invite" element={<AdminInvite />} />
        <Route path="gestion-administradores/password-changes" element={<AdminPasswordChanges />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="sessions" element={<AdminSessions />} />
        <Route path="roles" element={<AdminRol />} />
        <Route path="permisos" element={<GestionPermisos />} />
        <Route path="catalogos" element={<AdminCatalogos />} />
        <Route path="catalogos/categorias" element={<AdminCategorias />} />
        <Route path="catalogos/subcategorias" element={<AdminSubcategorias />} />
        <Route path="catalogos/productos" element={<AdminProductos />} />
        <Route path="gestion-usuarios" element={<AdminGestionUsuarios />} />
        <Route path="gestion-usuarios/usuarios" element={<AdminUsuarios />} />
        <Route path="gestion-usuarios/opiniones" element={<AdminOpinionesModeracion />} />
        <Route path="anuncios" element={<AdminAnuncios />} />
        <Route path="anuncios/banners" element={<AdminBanners />} />
        <Route path="pedidos" element={<AdminPedidos />} />
        <Route path="pedidos/listado" element={<AdminPedidosListado />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
