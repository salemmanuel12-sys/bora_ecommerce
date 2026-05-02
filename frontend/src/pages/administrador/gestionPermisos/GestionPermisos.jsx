import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  Layers,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import axios from '../../../api/axios';

const initialForm = { CODIGO: '', DESCRIPCION: '', ORDEN: 0 };
const SAFE_CODE_REGEX = /^[A-Za-z0-9_.:-]{2,80}$/;
const SAFE_DESC_REGEX = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü .,\-_:;()/%]{2,255}$/;
const normalizeText = (v) =>
  typeof v === 'string' ? v.normalize('NFKC').replace(/\s+/g, ' ').trim() : '';
const toNonNegativeInt = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isInteger(n) && n >= 0 ? n : 0;
};
const getErr = (err, fallback) => err.response?.data?.message || fallback;
const uniqueIds = (values) => [...new Set(values)];
const inputCls =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

// ── Shared sub-components ────────────────────────────────────────────────────
const FormLabel = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    {children}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <X size={20} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const EstadoPill = ({ value, onChange, labels = ['Activos', 'Inactivos'] }) => (
  <div className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700">
    <button
      type="button"
      onClick={() => onChange(1)}
      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${value === 1 ? 'bg-green-600 text-white' : 'text-gray-700 dark:text-gray-200'}`}
    >
      {labels[0]}
    </button>
    <button
      type="button"
      onClick={() => onChange(0)}
      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${value === 0 ? 'bg-amber-600 text-white' : 'text-gray-700 dark:text-gray-200'}`}
    >
      {labels[1]}
    </button>
  </div>
);

const ItemRow = ({ isSelected, onClick, label, sublabel, onEdit, onDelete, onReactivate, estado }) => (
  <div
    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors cursor-pointer ${isSelected ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
    onClick={onClick}
  >
    <div className="flex-1 min-w-0 mr-3">
      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{sublabel}</p>}
    </div>
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
      {estado === 1 ? (
        <>
          <button onClick={onEdit} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30" title="Editar">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30" title="Desactivar">
            <Trash2 size={14} />
          </button>
        </>
      ) : (
        <button onClick={onReactivate} className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30" title="Reactivar">
          <RefreshCw size={14} />
        </button>
      )}
    </div>
  </div>
);

const PermisoForm = ({ form, setForm, onSubmit, submitLabel, onCancel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <FormLabel label="Código">
      <input type="text" value={form.CODIGO} onChange={(e) => setForm({ ...form, CODIGO: e.target.value })} maxLength={80} required placeholder="Ej: USUARIOS" className={inputCls} />
    </FormLabel>
    <FormLabel label="Descripción">
      <textarea value={form.DESCRIPCION} onChange={(e) => setForm({ ...form, DESCRIPCION: e.target.value })} maxLength={255} rows={3} required placeholder="Describe el propósito" className={inputCls} />
    </FormLabel>
    <FormLabel label="Orden">
      <input type="number" value={form.ORDEN} onChange={(e) => setForm({ ...form, ORDEN: e.target.value })} min={0} max={9999} className={inputCls} />
    </FormLabel>
    <div className="flex justify-end gap-2 pt-2">
      {onCancel && (
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
          Cancelar
        </button>
      )}
      <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
        {submitLabel}
      </button>
    </div>
  </form>
);

// ── Main component ────────────────────────────────────────────────────────────
const GestionPermisos = () => {
  // Módulos
  const [modulos, setModulos] = useState([]);
  const [modulePage, setModulePage] = useState(1);
  const [moduloSearch, setModuloSearch] = useState('');
  const [moduloEstado, setModuloEstado] = useState(1);
  const [moduloLoading, setModuloLoading] = useState(false);
  const [moduloForm, setModuloForm] = useState(initialForm);
  const [editingModulo, setEditingModulo] = useState(null);
  const [showModuloModal, setShowModuloModal] = useState(false);

  // Submódulos
  const [selectedModuloId, setSelectedModuloId] = useState(null);
  const [submodulos, setSubmodulos] = useState([]);
  const [submoduloEstado, setSubmoduloEstado] = useState(1);
  const [submoduloLoading, setSubmoduloLoading] = useState(false);
  const [submoduloForm, setSubmoduloForm] = useState(initialForm);
  const [editingSubmodulo, setEditingSubmodulo] = useState(null);
  const [showSubmoduloModal, setShowSubmoduloModal] = useState(false);

  // Acciones
  const [selectedSubmoduloId, setSelectedSubmoduloId] = useState(null);
  const [acciones, setAcciones] = useState([]);
  const [accionEstado, setAccionEstado] = useState(1);
  const [accionLoading, setAccionLoading] = useState(false);
  const [accionForm, setAccionForm] = useState(initialForm);
  const [editingAccion, setEditingAccion] = useState(null);
  const [showAccionModal, setShowAccionModal] = useState(false);

  // Role assignment
  const [roles, setRoles] = useState([]);
  const [selectedRolId, setSelectedRolId] = useState(null);
  const [selectedModulos, setSelectedModulos] = useState([]);
  const [selectedSubmodulos, setSelectedSubmodulos] = useState([]);
  const [selectedAcciones, setSelectedAcciones] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesAssigning, setRolesAssigning] = useState(false);

  // Full catalog for role assignment
  const [catalogoLoading, setCatalogoLoading] = useState(false);
  const [catalogoModulos, setCatalogoModulos] = useState([]);
  const [catalogoSubmodulos, setCatalogoSubmodulos] = useState([]);
  const [catalogoAcciones, setCatalogoAcciones] = useState([]);

  const resetSelectedSubmodulo = () => {
    setSelectedSubmoduloId(null);
    setAcciones([]);
    setEditingAccion(null);
    setAccionForm(initialForm);
  };

  const resetSelectedModulo = () => {
    setSelectedModuloId(null);
    setSubmodulos([]);
    setEditingSubmodulo(null);
    setSubmoduloForm(initialForm);
    resetSelectedSubmodulo();
  };

  const fillForm = (setter, item) =>
    setter({ CODIGO: item.CODIGO, DESCRIPCION: item.DESCRIPCION, ORDEN: item.ORDEN || 0 });

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchModulos = async (page = 1, search = '', estado = 1) => {
    setModuloLoading(true);
    try {
      const res = await axios.get('/admin/permisos/modulos', { params: { page, limit: 10, search, estado } });
      setModulos(res.data.data || []);
    } catch (err) {
      toast.error(getErr(err, 'Error al cargar módulos'));
    } finally {
      setModuloLoading(false);
    }
  };

  const fetchSubmodulos = async (moduloId, estado = 1) => {
    if (!moduloId) return;
    setSubmoduloLoading(true);
    try {
      const res = await axios.get(`/admin/permisos/modulos/${moduloId}/submodulos`, { params: { estado } });
      setSubmodulos(res.data.data || []);
    } catch (err) {
      toast.error(getErr(err, 'Error al cargar submódulos'));
    } finally {
      setSubmoduloLoading(false);
    }
  };

  const fetchAcciones = async (moduloId, submoduloId, estado = 1) => {
    if (!moduloId || !submoduloId) return;
    setAccionLoading(true);
    try {
      const res = await axios.get(`/admin/permisos/modulos/${moduloId}/submodulos/${submoduloId}/acciones`, { params: { estado } });
      setAcciones(res.data.data || []);
    } catch (err) {
      toast.error(getErr(err, 'Error al cargar acciones'));
    } finally {
      setAccionLoading(false);
    }
  };

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await axios.get('/admin/roles');
      setRoles(res.data.data || []);
    } catch (err) {
      toast.error(getErr(err, 'Error al cargar roles'));
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchCatalogo = async () => {
    setCatalogoLoading(true);
    try {
      const res = await axios.get('/admin/permisos/modulos', { params: { page: 1, limit: 50, estado: 1 } });
      const mods = res.data.data || [];
      setCatalogoModulos(mods);
      const subsByMod = await Promise.all(
        mods.map(async (m) => {
          const r = await axios.get(`/admin/permisos/modulos/${m.ID_MODULO}/submodulos`, { params: { estado: 1 } });
          return r.data.data || [];
        })
      );
      const subs = subsByMod.flat();
      setCatalogoSubmodulos(subs);
      const accBySub = await Promise.all(
        subs.map(async (sub) => {
          const r = await axios.get(`/admin/permisos/modulos/${sub.MODULO_ID}/submodulos/${sub.ID_SUBMODULO}/acciones`, { params: { estado: 1 } });
          return r.data.data || [];
        })
      );
      setCatalogoAcciones(accBySub.flat());
    } catch (err) {
      toast.error(getErr(err, 'Error al cargar el catálogo de permisos'));
    } finally {
      setCatalogoLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchModulos(modulePage, moduloSearch, moduloEstado), fetchCatalogo()]);
    if (selectedModuloId) await fetchSubmodulos(selectedModuloId, submoduloEstado);
    if (selectedModuloId && selectedSubmoduloId) await fetchAcciones(selectedModuloId, selectedSubmoduloId, accionEstado);
    if (selectedRolId) await fetchRolePermisos(selectedRolId);
  };

  // ── CRUD: Módulos ─────────────────────────────────────────────────────────
  const handleSaveModulo = async (e) => {
    e.preventDefault();
    const codigo = normalizeText(moduloForm.CODIGO).toUpperCase();
    const descripcion = normalizeText(moduloForm.DESCRIPCION);
    if (!SAFE_CODE_REGEX.test(codigo)) { toast.error('Código inválido'); return; }
    if (!SAFE_DESC_REGEX.test(descripcion)) { toast.error('Descripción inválida'); return; }
    try {
      const payload = { CODIGO: codigo, DESCRIPCION: descripcion, ORDEN: toNonNegativeInt(moduloForm.ORDEN) };
      if (editingModulo) {
        await axios.put(`/admin/permisos/modulos/${editingModulo.ID_MODULO}`, payload);
        toast.success('Módulo actualizado');
      } else {
        await axios.post('/admin/permisos/modulos', payload);
        toast.success('Módulo creado');
      }
      setModuloForm(initialForm); setEditingModulo(null); setShowModuloModal(false);
      await refreshAll();
    } catch (err) { toast.error(getErr(err, 'Error al guardar módulo')); }
  };

  const handleDeleteModulo = async (id) => {
    if (!window.confirm('¿Desactivar este módulo?')) return;
    try {
      await axios.delete(`/admin/permisos/modulos/${id}`);
      if (selectedModuloId === id) resetSelectedModulo();
      toast.success('Módulo desactivado');
      await refreshAll();
    } catch (err) { toast.error(getErr(err, 'Error al desactivar')); }
  };

  const handleReactivateModulo = async (id) => {
    try {
      await axios.patch(`/admin/permisos/modulos/${id}/reactivate`);
      toast.success('Módulo reactivado');
      await refreshAll();
    } catch (err) { toast.error(getErr(err, 'Error al reactivar')); }
  };

  // ── CRUD: Submódulos ──────────────────────────────────────────────────────
  const handleSaveSubmodulo = async (e) => {
    e.preventDefault();
    if (!selectedModuloId) { toast.error('Selecciona un módulo primero'); return; }
    const codigo = normalizeText(submoduloForm.CODIGO).toUpperCase();
    const descripcion = normalizeText(submoduloForm.DESCRIPCION);
    if (!SAFE_CODE_REGEX.test(codigo)) { toast.error('Código inválido'); return; }
    if (!SAFE_DESC_REGEX.test(descripcion)) { toast.error('Descripción inválida'); return; }
    try {
      const payload = { CODIGO: codigo, DESCRIPCION: descripcion, ORDEN: toNonNegativeInt(submoduloForm.ORDEN) };
      if (editingSubmodulo) {
        await axios.put(`/admin/permisos/modulos/${selectedModuloId}/submodulos/${editingSubmodulo.ID_SUBMODULO}`, payload);
        toast.success('Submódulo actualizado');
      } else {
        await axios.post(`/admin/permisos/modulos/${selectedModuloId}/submodulos`, payload);
        toast.success('Submódulo creado');
      }
      setSubmoduloForm(initialForm); setEditingSubmodulo(null); setShowSubmoduloModal(false);
      await refreshAll();
    } catch (err) { toast.error(getErr(err, 'Error al guardar submódulo')); }
  };

  const handleDeleteSubmodulo = async (id) => {
    if (!window.confirm('¿Desactivar este submódulo?')) return;
    try {
      await axios.delete(`/admin/permisos/modulos/${selectedModuloId}/submodulos/${id}`);
      if (selectedSubmoduloId === id) resetSelectedSubmodulo();
      toast.success('Submódulo desactivado');
      await refreshAll();
    } catch (err) { toast.error(getErr(err, 'Error al desactivar')); }
  };

  const handleReactivateSubmodulo = async (id) => {
    try {
      await axios.patch(`/admin/permisos/modulos/${selectedModuloId}/submodulos/${id}/reactivate`);
      toast.success('Submódulo reactivado');
      await refreshAll();
    } catch (err) { toast.error(getErr(err, 'Error al reactivar')); }
  };

  // ── CRUD: Acciones ────────────────────────────────────────────────────────
  const handleSaveAccion = async (e) => {
    e.preventDefault();
    if (!selectedModuloId || !selectedSubmoduloId) { toast.error('Selecciona un submódulo primero'); return; }
    const codigo = normalizeText(accionForm.CODIGO).toUpperCase();
    const descripcion = normalizeText(accionForm.DESCRIPCION);
    if (!SAFE_CODE_REGEX.test(codigo)) { toast.error('Código inválido'); return; }
    if (!SAFE_DESC_REGEX.test(descripcion)) { toast.error('Descripción inválida'); return; }
    try {
      const payload = { CODIGO: codigo, DESCRIPCION: descripcion, ORDEN: toNonNegativeInt(accionForm.ORDEN) };
      if (editingAccion) {
        await axios.put(`/admin/permisos/modulos/${selectedModuloId}/submodulos/${selectedSubmoduloId}/acciones/${editingAccion.ID_ACCION}`, payload);
        toast.success('Acción actualizada');
      } else {
        await axios.post(`/admin/permisos/modulos/${selectedModuloId}/submodulos/${selectedSubmoduloId}/acciones`, payload);
        toast.success('Acción creada');
      }
      setAccionForm(initialForm); setEditingAccion(null); setShowAccionModal(false);
      await refreshAll();
    } catch (err) { toast.error(getErr(err, 'Error al guardar acción')); }
  };

  const handleDeleteAccion = async (id) => {
    if (!window.confirm('¿Desactivar esta acción?')) return;
    try {
      await axios.delete(`/admin/permisos/modulos/${selectedModuloId}/submodulos/${selectedSubmoduloId}/acciones/${id}`);
      toast.success('Acción desactivada');
      await refreshAll();
    } catch (err) { toast.error(getErr(err, 'Error al desactivar')); }
  };

  const handleReactivateAccion = async (id) => {
    try {
      await axios.patch(`/admin/permisos/modulos/${selectedModuloId}/submodulos/${selectedSubmoduloId}/acciones/${id}/reactivate`);
      toast.success('Acción reactivada');
      await refreshAll();
    } catch (err) { toast.error(getErr(err, 'Error al reactivar')); }
  };

  // ── Role permisos ─────────────────────────────────────────────────────────
  const fetchRolePermisos = async (rolId) => {
    try {
      const res = await axios.get(`/admin/roles/${rolId}/permisos-jerarquicos`);
      setSelectedModulos(res.data.modulosAsignados || []);
      setSelectedSubmodulos(res.data.submodulosAsignados || []);
      setSelectedAcciones(res.data.accionesAsignadas || []);
    } catch (err) { toast.error(getErr(err, 'Error al cargar permisos del rol')); }
  };

  const handleSaveRolePermisos = async () => {
    if (!selectedRolId) { toast.error('Selecciona un rol'); return; }
    try {
      setRolesAssigning(true);
      await axios.put(`/admin/roles/${selectedRolId}/permisos-jerarquicos`, {
        MODULOS: selectedModulos,
        SUBMODULOS: selectedSubmodulos,
        ACCIONES: selectedAcciones,
      });
      toast.success('Permisos del rol actualizados');
      await fetchRolePermisos(selectedRolId);
    } catch (err) { toast.error(getErr(err, 'Error al actualizar permisos')); }
    finally { setRolesAssigning(false); }
  };

  const getSubmodulosByModulo = (moduloId) =>
    catalogoSubmodulos.filter((sub) => sub.MODULO_ID === moduloId);

  const getAccionesBySubmodulo = (submoduloId) =>
    catalogoAcciones.filter((accion) => accion.SUBMODULO_ID === submoduloId);

  const syncSelectedSubmodulos = (baseSubmodulos, nextAcciones) => {
    let nextSubmodulos = baseSubmodulos.filter((subId) => {
      const acciones = getAccionesBySubmodulo(subId);
      return acciones.length === 0 || acciones.every((accion) => nextAcciones.includes(accion.ID_ACCION));
    });

    catalogoSubmodulos.forEach((sub) => {
      const acciones = getAccionesBySubmodulo(sub.ID_SUBMODULO);
      if (acciones.length > 0 && acciones.every((accion) => nextAcciones.includes(accion.ID_ACCION))) {
        nextSubmodulos.push(sub.ID_SUBMODULO);
      }
    });

    return uniqueIds(nextSubmodulos);
  };

  const syncSelectedModulos = (baseModulos, nextSubmodulos, nextAcciones) => {
    let nextModulos = baseModulos.filter((moduloId) => {
      const submodulos = getSubmodulosByModulo(moduloId);
      if (submodulos.length === 0) return true;
      return submodulos.every((sub) => {
        const acciones = getAccionesBySubmodulo(sub.ID_SUBMODULO);
        const accionesCompletas = acciones.length === 0 || acciones.every((accion) => nextAcciones.includes(accion.ID_ACCION));
        return nextSubmodulos.includes(sub.ID_SUBMODULO) && accionesCompletas;
      });
    });

    catalogoModulos.forEach((modulo) => {
      const submodulos = getSubmodulosByModulo(modulo.ID_MODULO);
      if (submodulos.length > 0 && submodulos.every((sub) => {
        const acciones = getAccionesBySubmodulo(sub.ID_SUBMODULO);
        const accionesCompletas = acciones.length === 0 || acciones.every((accion) => nextAcciones.includes(accion.ID_ACCION));
        return nextSubmodulos.includes(sub.ID_SUBMODULO) && accionesCompletas;
      })) {
        nextModulos.push(modulo.ID_MODULO);
      }
    });

    return uniqueIds(nextModulos);
  };

  const applySelectionTree = (nextModulos, nextSubmodulos, nextAcciones) => {
    const syncedSubmodulos = syncSelectedSubmodulos(nextSubmodulos, nextAcciones);
    const syncedModulos = syncSelectedModulos(nextModulos, syncedSubmodulos, nextAcciones);
    setSelectedAcciones(uniqueIds(nextAcciones));
    setSelectedSubmodulos(syncedSubmodulos);
    setSelectedModulos(syncedModulos);
  };

  const isSubmoduloChecked = (submoduloId) => {
    const acciones = getAccionesBySubmodulo(submoduloId);
    if (acciones.length === 0) return selectedSubmodulos.includes(submoduloId);
    return selectedSubmodulos.includes(submoduloId) && acciones.every((accion) => selectedAcciones.includes(accion.ID_ACCION));
  };

  const isSubmoduloIndeterminate = (submoduloId) => {
    if (isSubmoduloChecked(submoduloId)) return false;
    return selectedSubmodulos.includes(submoduloId) || getAccionesBySubmodulo(submoduloId).some((accion) => selectedAcciones.includes(accion.ID_ACCION));
  };

  const isModuloChecked = (moduloId) => {
    const submodulos = getSubmodulosByModulo(moduloId);
    if (submodulos.length === 0) return selectedModulos.includes(moduloId);
    return selectedModulos.includes(moduloId) && submodulos.every((sub) => isSubmoduloChecked(sub.ID_SUBMODULO));
  };

  const isModuloIndeterminate = (moduloId) => {
    if (isModuloChecked(moduloId)) return false;
    return selectedModulos.includes(moduloId) || getSubmodulosByModulo(moduloId).some((sub) => isSubmoduloChecked(sub.ID_SUBMODULO) || isSubmoduloIndeterminate(sub.ID_SUBMODULO));
  };

  const toggleModuloBranch = (moduloId) => {
    const submodulos = getSubmodulosByModulo(moduloId);
    const subIds = submodulos.map((sub) => sub.ID_SUBMODULO);
    const accionIds = submodulos.flatMap((sub) => getAccionesBySubmodulo(sub.ID_SUBMODULO).map((accion) => accion.ID_ACCION));
    const moduloCompleto = isModuloChecked(moduloId);

    if (moduloCompleto) {
      applySelectionTree(
        selectedModulos.filter((id) => id !== moduloId),
        selectedSubmodulos.filter((id) => !subIds.includes(id)),
        selectedAcciones.filter((id) => !accionIds.includes(id))
      );
      return;
    }

    applySelectionTree(
      [...selectedModulos, moduloId],
      [...selectedSubmodulos, ...subIds],
      [...selectedAcciones, ...accionIds]
    );
  };

  const toggleSubmoduloBranch = (moduloId, submoduloId) => {
    const accionIds = getAccionesBySubmodulo(submoduloId).map((accion) => accion.ID_ACCION);
    const submoduloCompleto = isSubmoduloChecked(submoduloId);

    if (submoduloCompleto) {
      applySelectionTree(
        selectedModulos.filter((id) => id !== moduloId),
        selectedSubmodulos.filter((id) => id !== submoduloId),
        selectedAcciones.filter((id) => !accionIds.includes(id))
      );
      return;
    }

    applySelectionTree(
      selectedModulos,
      [...selectedSubmodulos, submoduloId],
      [...selectedAcciones, ...accionIds]
    );
  };

  const toggleAccionLeaf = (moduloId, submoduloId, accionId) => {
    const nextAcciones = selectedAcciones.includes(accionId)
      ? selectedAcciones.filter((id) => id !== accionId)
      : [...selectedAcciones, accionId];

    applySelectionTree(
      selectedModulos.filter((id) => id !== moduloId),
      selectedSubmodulos.filter((id) => id !== submoduloId),
      nextAcciones
    );
  };

  const totalTreeNodes = catalogoModulos.length + catalogoSubmodulos.length + catalogoAcciones.length;
  const selectedTreeNodes = selectedModulos.length + selectedSubmodulos.length + selectedAcciones.length;
  const permissionTree = catalogoModulos.map((modulo) => {
    const submodulos = getSubmodulosByModulo(modulo.ID_MODULO).map((sub) => ({
      ...sub,
      acciones: getAccionesBySubmodulo(sub.ID_SUBMODULO),
    }));

    return { ...modulo, submodulos };
  });

  const getModuloCodigo = (id) =>
    catalogoModulos.find((m) => m.ID_MODULO === id)?.CODIGO || `Módulo ${id}`;

  const getSubmoduloLabel = (sub) => `${getModuloCodigo(sub.MODULO_ID)} / ${sub.CODIGO}`;

  const getAccionLabel = (acc) => {
    const sub = catalogoSubmodulos.find((s) => s.ID_SUBMODULO === acc.SUBMODULO_ID);
    return sub ? `${getSubmoduloLabel(sub)} / ${acc.CODIGO}` : acc.CODIGO;
  };

  const selectedModuloLabel = modulos.find((m) => m.ID_MODULO === selectedModuloId)?.CODIGO;
  const selectedSubmoduloLabel = submodulos.find((s) => s.ID_SUBMODULO === selectedSubmoduloId)?.CODIGO;

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchModulos(modulePage, moduloSearch, moduloEstado); }, [modulePage, moduloSearch, moduloEstado]);
  useEffect(() => { fetchRoles(); fetchCatalogo(); }, []);
  useEffect(() => { if (selectedModuloId) fetchSubmodulos(selectedModuloId, submoduloEstado); }, [selectedModuloId, submoduloEstado]);
  useEffect(() => { if (selectedModuloId && selectedSubmoduloId) fetchAcciones(selectedModuloId, selectedSubmoduloId, accionEstado); }, [selectedModuloId, selectedSubmoduloId, accionEstado]);
  useEffect(() => {
    if (!selectedRolId) {
      setSelectedModulos([]); setSelectedSubmodulos([]); setSelectedAcciones([]);
      return;
    }
    fetchRolePermisos(selectedRolId);
  }, [selectedRolId]);

  // PermisoForm is defined at module level to avoid re-creation on each render (which would cause focus loss)

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Permisos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Organiza módulos, submódulos y acciones del sistema de manera jerárquica.
        </p>
      </div>

      {/* ── SECTION 1: Módulos ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <LayoutGrid size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Módulos</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nivel 1 de la jerarquía</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingModulo(null); setModuloForm(initialForm); setShowModuloModal(true); }}
            disabled={moduloEstado === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Nuevo módulo
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar módulo..."
              value={moduloSearch}
              onChange={(e) => { setModuloSearch(e.target.value); setModulePage(1); }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-9 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              maxLength={100}
            />
          </div>
          <EstadoPill value={moduloEstado} onChange={(v) => { setModuloEstado(v); setModulePage(1); }} />
        </div>

        {moduloLoading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-300">
            <Loader2 className="animate-spin" size={18} /> Cargando módulos...
          </div>
        ) : modulos.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-300">
            No hay módulos {moduloEstado === 1 ? 'activos' : 'inactivos'} para mostrar.
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {modulos.map((m) => (
              <ItemRow
                key={m.ID_MODULO}
                isSelected={selectedModuloId === m.ID_MODULO}
                onClick={() => { setSelectedModuloId(m.ID_MODULO); resetSelectedSubmodulo(); setEditingSubmodulo(null); setSubmoduloForm(initialForm); }}
                label={m.CODIGO}
                sublabel={m.DESCRIPCION}
                estado={moduloEstado}
                onEdit={() => { setEditingModulo(m); fillForm(setModuloForm, m); setShowModuloModal(true); }}
                onDelete={() => handleDeleteModulo(m.ID_MODULO)}
                onReactivate={() => handleReactivateModulo(m.ID_MODULO)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Submódulos ─────────────────────────────────────────── */}
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-5 transition-opacity ${selectedModuloId ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <LayoutGrid size={12} />
          <span className="font-medium text-gray-700 dark:text-gray-200">{selectedModuloLabel || 'Módulo'}</span>
          <ChevronRight size={12} />
          <span>Submódulos</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Layers size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Submódulos</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nivel 2 de la jerarquía</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <EstadoPill value={submoduloEstado} onChange={setSubmoduloEstado} />
            <button
              onClick={() => { setEditingSubmodulo(null); setSubmoduloForm(initialForm); setShowSubmoduloModal(true); }}
              disabled={!selectedModuloId || submoduloEstado === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Nuevo submódulo
            </button>
          </div>
        </div>

        {!selectedModuloId ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Selecciona un módulo arriba para ver sus submódulos.
          </p>
        ) : submoduloLoading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-300">
            <Loader2 className="animate-spin" size={18} /> Cargando submódulos...
          </div>
        ) : submodulos.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-300">
            No hay submódulos {submoduloEstado === 1 ? 'activos' : 'inactivos'} para este módulo.
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {submodulos.map((sub) => (
              <ItemRow
                key={sub.ID_SUBMODULO}
                isSelected={selectedSubmoduloId === sub.ID_SUBMODULO}
                onClick={() => { setSelectedSubmoduloId(sub.ID_SUBMODULO); setEditingAccion(null); setAccionForm(initialForm); }}
                label={sub.CODIGO}
                sublabel={sub.DESCRIPCION}
                estado={submoduloEstado}
                onEdit={() => { setEditingSubmodulo(sub); fillForm(setSubmoduloForm, sub); setShowSubmoduloModal(true); }}
                onDelete={() => handleDeleteSubmodulo(sub.ID_SUBMODULO)}
                onReactivate={() => handleReactivateSubmodulo(sub.ID_SUBMODULO)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 3: Acciones ───────────────────────────────────────────── */}
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-5 transition-opacity ${selectedSubmoduloId ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <LayoutGrid size={12} />
          <span>{selectedModuloLabel || 'Módulo'}</span>
          <ChevronRight size={12} />
          <Layers size={12} />
          <span className="font-medium text-gray-700 dark:text-gray-200">{selectedSubmoduloLabel || 'Submódulo'}</span>
          <ChevronRight size={12} />
          <span>Acciones</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Zap size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Acciones</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nivel 3 de la jerarquía</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <EstadoPill value={accionEstado} onChange={setAccionEstado} labels={['Activas', 'Inactivas']} />
            <button
              onClick={() => { setEditingAccion(null); setAccionForm(initialForm); setShowAccionModal(true); }}
              disabled={!selectedSubmoduloId || accionEstado === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Nueva acción
            </button>
          </div>
        </div>

        {!selectedSubmoduloId ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Selecciona un submódulo arriba para ver sus acciones.
          </p>
        ) : accionLoading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-300">
            <Loader2 className="animate-spin" size={18} /> Cargando acciones...
          </div>
        ) : acciones.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-300">
            No hay acciones {accionEstado === 1 ? 'activas' : 'inactivas'} para este submódulo.
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {acciones.map((acc) => (
              <ItemRow
                key={acc.ID_ACCION}
                isSelected={false}
                onClick={() => {}}
                label={acc.CODIGO}
                sublabel={acc.DESCRIPCION}
                estado={accionEstado}
                onEdit={() => { setEditingAccion(acc); fillForm(setAccionForm, acc); setShowAccionModal(true); }}
                onDelete={() => handleDeleteAccion(acc.ID_ACCION)}
                onReactivate={() => handleReactivateAccion(acc.ID_ACCION)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 4: Asignar permisos a rol ────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Shield size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Asignar Permisos a Rol</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Selecciona qué módulos, submódulos y acciones puede usar cada rol
              </p>
            </div>
          </div>
          {catalogoLoading && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="animate-spin" size={14} />
              <span>Actualizando catálogo…</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
          {rolesLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="animate-spin" size={14} /> Cargando roles...
            </div>
          ) : (
            <select
              value={selectedRolId || ''}
              onChange={(e) => setSelectedRolId(Number.parseInt(e.target.value, 10) || null)}
              className={inputCls}
            >
              <option value="">-- Selecciona un rol --</option>
              {roles.map((r) => <option key={r.ID_ROL} value={r.ID_ROL}>{r.NOMBRE}</option>)}
            </select>
          )}
        </div>

        {selectedRolId && (
          <>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-linear-to-b from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-800/60 p-4 sm:p-5 mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Árbol de permisos</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Marca ramas completas o selecciona solo algunos nodos para dejar el módulo en estado parcial.</p>
                </div>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Módulos {selectedModulos.length}/{catalogoModulos.length}</span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">Submódulos {selectedSubmodulos.length}/{catalogoSubmodulos.length}</span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">Acciones {selectedAcciones.length}/{catalogoAcciones.length}</span>
                  <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Total {selectedTreeNodes}/{totalTreeNodes}</span>
                </div>
              </div>

              <div className="max-h-136 overflow-y-auto pr-1 space-y-3">
                {permissionTree.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay permisos activos para mostrar.</p>
                ) : permissionTree.map((modulo) => {
                  const moduloChecked = isModuloChecked(modulo.ID_MODULO);
                  const moduloIndeterminate = isModuloIndeterminate(modulo.ID_MODULO);

                  return (
                    <div key={modulo.ID_MODULO} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 overflow-hidden">
                      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50/70 dark:bg-blue-950/20 border-b border-gray-200 dark:border-gray-700">
                        <input
                          type="checkbox"
                          checked={moduloChecked}
                          ref={(element) => {
                            if (element) element.indeterminate = moduloIndeterminate;
                          }}
                          onChange={() => toggleModuloBranch(modulo.ID_MODULO)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <LayoutGrid size={15} className="text-blue-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">{modulo.CODIGO}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                              {modulo.submodulos.length} submódulos
                            </span>
                          </div>
                          {modulo.DESCRIPCION && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{modulo.DESCRIPCION}</p>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        {modulo.submodulos.length === 0 ? (
                          <p className="text-sm text-gray-400 dark:text-gray-500 pl-7">Este módulo no tiene submódulos activos.</p>
                        ) : (
                          <div className="space-y-3 border-l-2 border-blue-100 dark:border-blue-900/40 ml-2 pl-5">
                            {modulo.submodulos.map((submodulo) => {
                              const submoduloChecked = isSubmoduloChecked(submodulo.ID_SUBMODULO);
                              const submoduloIndeterminate = isSubmoduloIndeterminate(submodulo.ID_SUBMODULO);

                              return (
                                <div key={submodulo.ID_SUBMODULO} className="relative">
                                  <div className="absolute -left-5 top-3 h-px w-4 bg-blue-200 dark:bg-blue-900/60" />
                                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-purple-50/40 dark:bg-purple-950/10 px-3 py-3">
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        checked={submoduloChecked}
                                        ref={(element) => {
                                          if (element) element.indeterminate = submoduloIndeterminate;
                                        }}
                                        onChange={() => toggleSubmoduloBranch(modulo.ID_MODULO, submodulo.ID_SUBMODULO)}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Layers size={14} className="text-purple-500" />
                                          <span className="font-medium text-gray-900 dark:text-white">{submodulo.CODIGO}</span>
                                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                            {submodulo.acciones.length} acciones
                                          </span>
                                        </div>
                                        {submodulo.DESCRIPCION && (
                                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{submodulo.DESCRIPCION}</p>
                                        )}

                                        {submodulo.acciones.length === 0 ? (
                                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Este submódulo no tiene acciones activas.</p>
                                        ) : (
                                          <div className="mt-3 space-y-2 border-l-2 border-purple-100 dark:border-purple-900/40 pl-4 ml-2">
                                            {submodulo.acciones.map((accion) => (
                                              <label key={accion.ID_ACCION} className="relative flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-amber-50/60 dark:hover:bg-amber-950/10 cursor-pointer">
                                                <span className="absolute -left-4 top-4 h-px w-3 bg-purple-200 dark:bg-purple-900/60" />
                                                <input
                                                  type="checkbox"
                                                  checked={selectedAcciones.includes(accion.ID_ACCION)}
                                                  onChange={() => toggleAccionLeaf(modulo.ID_MODULO, submodulo.ID_SUBMODULO, accion.ID_ACCION)}
                                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                />
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <Zap size={13} className="text-amber-500" />
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{accion.CODIGO}</span>
                                                  </div>
                                                  {accion.DESCRIPCION && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{accion.DESCRIPCION}</p>
                                                  )}
                                                </div>
                                              </label>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveRolePermisos}
                disabled={rolesAssigning || catalogoLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium"
              >
                {rolesAssigning && <Loader2 className="animate-spin" size={16} />}
                {rolesAssigning ? 'Guardando…' : 'Guardar permisos del rol'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────── */}

      {showModuloModal && (
        <Modal
          title={editingModulo ? 'Editar Módulo' : 'Nuevo Módulo'}
          onClose={() => { setShowModuloModal(false); setEditingModulo(null); setModuloForm(initialForm); }}
        >
          <PermisoForm
            form={moduloForm}
            setForm={setModuloForm}
            onSubmit={handleSaveModulo}
            submitLabel={editingModulo ? 'Guardar cambios' : 'Crear módulo'}
            onCancel={() => { setShowModuloModal(false); setEditingModulo(null); setModuloForm(initialForm); }}
          />
        </Modal>
      )}

      {showSubmoduloModal && (
        <Modal
          title={editingSubmodulo ? 'Editar Submódulo' : 'Nuevo Submódulo'}
          onClose={() => { setShowSubmoduloModal(false); setEditingSubmodulo(null); setSubmoduloForm(initialForm); }}
        >
          {selectedModuloLabel && (
            <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
              <LayoutGrid size={12} className="text-blue-500" />
              <span>Módulo: <strong className="text-gray-700 dark:text-gray-200">{selectedModuloLabel}</strong></span>
            </div>
          )}
          <PermisoForm
            form={submoduloForm}
            setForm={setSubmoduloForm}
            onSubmit={handleSaveSubmodulo}
            submitLabel={editingSubmodulo ? 'Guardar cambios' : 'Crear submódulo'}
            onCancel={() => { setShowSubmoduloModal(false); setEditingSubmodulo(null); setSubmoduloForm(initialForm); }}
          />
        </Modal>
      )}

      {showAccionModal && (
        <Modal
          title={editingAccion ? 'Editar Acción' : 'Nueva Acción'}
          onClose={() => { setShowAccionModal(false); setEditingAccion(null); setAccionForm(initialForm); }}
        >
          {(selectedModuloLabel || selectedSubmoduloLabel) && (
            <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
              <LayoutGrid size={12} className="text-blue-500" />
              <span>{selectedModuloLabel}</span>
              <ChevronRight size={10} />
              <Layers size={12} className="text-purple-500" />
              <span>{selectedSubmoduloLabel}</span>
            </div>
          )}
          <PermisoForm
            form={accionForm}
            setForm={setAccionForm}
            onSubmit={handleSaveAccion}
            submitLabel={editingAccion ? 'Guardar cambios' : 'Crear acción'}
            onCancel={() => { setShowAccionModal(false); setEditingAccion(null); setAccionForm(initialForm); }}
          />
        </Modal>
      )}
    </div>
  );
};

export default GestionPermisos;
