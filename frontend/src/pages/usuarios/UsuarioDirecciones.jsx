import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NavbarSesion from "../../components/usuarios/NavbarSesion";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { direccionService } from "../../api/direccionService";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  stateCode: "",
  postalCode: "",
  country: "Mexico",
  references: "",
};

function UsuarioDirecciones() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [states, setStates] = useState([]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const loadAddresses = async () => {
      try {
        const rows = await direccionService.list();
        setAddresses(Array.isArray(rows) ? rows : []);
      } catch (error) {
        toast.error(error?.response?.data?.message || "No se pudieron cargar direcciones.");
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const loadStates = async () => {
      try {
        const rows = await direccionService.listStates();
        setStates(Array.isArray(rows) ? rows : []);
      } catch {
        setStates([]);
      }
    };

    loadStates();
  }, [authLoading, user]);

  useEffect(() => {
    if (!editingId || form.stateCode || !form.state || states.length === 0) {
      return;
    }

    const matched = states.find((item) => item.name === form.state);
    if (matched?.code) {
      setForm((prev) => ({ ...prev, stateCode: matched.code }));
    }
  }, [editingId, form.state, form.stateCode, states]);

  if (authLoading) {
    return null;
  }

  if (!user) {
    navigate("/user", { replace: true });
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "stateCode") {
      const selected = states.find((item) => item.code === value);
      setForm((prev) => ({
        ...prev,
        stateCode: value,
        state: selected?.name || "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleEdit = (address) => {
    setEditingId(address.id);
    setForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      stateCode:
        address.stateCode ||
        states.find((item) => item.name === address.state)?.code ||
        "",
      postalCode: address.postalCode || "",
      country: address.country || "Mexico",
      references: address.references || "",
    });
  };

  const validateForm = () => {
    const required = ["fullName", "phone", "street", "city", "stateCode", "postalCode"];
    return !required.some((field) => !String(form[field] || "").trim());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Completa los campos requeridos de direccion.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        stateCode: form.stateCode.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: (form.country || "Mexico").trim(),
        references: form.references?.trim() || "",
      };

      if (editingId) {
        const updated = await direccionService.update(editingId, payload);
        setAddresses((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        toast.success("Direccion actualizada.");
      } else {
        const created = await direccionService.create(payload);
        setAddresses((prev) => [created, ...prev]);
        toast.success("Direccion creada.");
      }

      resetForm();
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo guardar la direccion.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await direccionService.remove(id);
      setAddresses((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
      toast.success("Direccion eliminada.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo eliminar la direccion.");
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_28%,#fbf7ff_64%,#ffffff_100%)] text-[#231f20]">
      <NavbarSesion
        active="direcciones"
        userName={user?.nombre || "Cliente"}
        cartCount={0}
        onLogout={logout}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#9b24cf]">Cuenta</p>
            <h1 className="text-4xl" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
              Mis direcciones
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to="/usuarios/home-sesion" className="rounded-xl border border-[#e7d8fb] px-4 py-2 text-sm font-semibold text-[#6a40d8]">
              Catalogo
            </Link>
            <Link to="/usuarios/pedidos" className="rounded-xl bg-[#231f20] px-4 py-2 text-sm font-semibold text-white">
              Pedidos
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <article className="rounded-3xl border border-[#ebe6f7] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(70,40,160,0.2)]">
            <div className="mb-4 flex items-center gap-2 text-[#6a40d8]">
              <MapPin size={18} />
              <h2 className="text-2xl" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                Direcciones guardadas
              </h2>
            </div>

            {loading ? (
              <div className="h-24 animate-pulse rounded-2xl border border-[#efe8ff] bg-[#faf7ff]" />
            ) : addresses.length === 0 ? (
              <p className="text-sm text-[#5b5866]">No tienes direcciones registradas.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div key={address.id} className="rounded-2xl border border-[#efe8ff] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm text-[#5b5866]">
                        <p className="font-semibold text-[#231f20]">{address.fullName}</p>
                        <p>{address.phone}</p>
                        <p>{address.street}</p>
                        <p>
                          {address.city}, {address.state}, {address.postalCode}
                        </p>
                        <p>{address.country}</p>
                        {address.references ? <p>Ref: {address.references}</p> : null}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(address)}
                          className="rounded-lg border border-[#e7d8fb] p-2 text-[#6a40d8]"
                          aria-label="Editar direccion"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(address.id)}
                          className="rounded-lg border border-rose-200 p-2 text-rose-600"
                          aria-label="Eliminar direccion"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-[#ebe6f7] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(70,40,160,0.2)]">
            <div className="mb-4 flex items-center gap-2 text-[#6a40d8]">
              <Plus size={18} />
              <h2 className="text-2xl" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                {editingId ? "Editar direccion" : "Nueva direccion"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Nombre completo" className="w-full rounded-xl border border-[#e7d8fb] px-3 py-2.5 text-sm" />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Telefono" className="w-full rounded-xl border border-[#e7d8fb] px-3 py-2.5 text-sm" />
              <input name="street" value={form.street} onChange={handleChange} placeholder="Calle y numero" className="w-full rounded-xl border border-[#e7d8fb] px-3 py-2.5 text-sm" />

              <div className="grid grid-cols-2 gap-2">
                <input name="city" value={form.city} onChange={handleChange} placeholder="Ciudad" className="w-full rounded-xl border border-[#e7d8fb] px-3 py-2.5 text-sm" />
                <select
                  name="stateCode"
                  value={form.stateCode}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#e7d8fb] px-3 py-2.5 text-sm"
                >
                  <option value="">Selecciona estado</option>
                  {states.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="Codigo postal" className="w-full rounded-xl border border-[#e7d8fb] px-3 py-2.5 text-sm" />
                <input name="country" value={form.country} onChange={handleChange} placeholder="Pais" className="w-full rounded-xl border border-[#e7d8fb] px-3 py-2.5 text-sm" />
              </div>

              <textarea
                name="references"
                value={form.references}
                onChange={handleChange}
                placeholder="Referencias"
                rows={3}
                className="w-full resize-none rounded-xl border border-[#e7d8fb] px-3 py-2.5 text-sm"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#231f20] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-[#e7d8fb] px-4 py-2.5 text-sm font-semibold text-[#6a40d8]"
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          </article>
        </div>
      </section>

      <FooterUsuario catalogPath="/usuarios/home-sesion" catalogLabel="Catalogo privado" />
    </main>
  );
}

export default UsuarioDirecciones;
