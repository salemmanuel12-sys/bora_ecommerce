import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { adminPaquetesService } from "../../../api/adminPaquetesService";

const INITIAL_FORM = {
  id: "",
  name: "Caja Grande",
  product_type: "47131900",
  unit_type: "XBX",
  package_content: "Playeras",
  amount_pkg: "600.00",
  height: "10.00",
  width: "10.00",
  length: "10.00",
  weight: "10.00",
  real_weight: "10.00",
  volumetric_weight: "10.00",
  bill_weight: "10.00",
  default_pkg: false,
};

function tryGetArrayFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.packages)) return payload.packages;
  if (Array.isArray(payload.response)) return payload.response;
  if (payload.data && typeof payload.data === "object") {
    for (const value of Object.values(payload.data)) {
      if (Array.isArray(value)) return value;
    }
  }

  return [];
}

function getPackageId(item) {
  const id = item?.id ?? item?.ID ?? item?.package_id ?? item?.PACKAGE_ID;
  return String(id ?? "").trim();
}

function getPackageName(item) {
  return String(item?.name ?? item?.NAME ?? item?.package_name ?? "Sin nombre");
}

export default function AdminPedidosPaquetes() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [packageIdSearch, setPackageIdSearch] = useState("");
  const [packagesRaw, setPackagesRaw] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [workingAction, setWorkingAction] = useState("");
  const [packageById, setPackageById] = useState(null);
  const [productTypeOptions, setProductTypeOptions] = useState([]);
  const [unitTypeOptions, setUnitTypeOptions] = useState([]);
  const [productTypeSearch, setProductTypeSearch] = useState("");
  const [unitTypeSearch, setUnitTypeSearch] = useState("");

  const packagesList = useMemo(() => tryGetArrayFromPayload(packagesRaw), [packagesRaw]);

  const filteredProductTypeOptions = useMemo(() => {
    const needle = String(productTypeSearch || "").trim().toLowerCase();
    if (!needle) return productTypeOptions;

    return productTypeOptions.filter((item) =>
      String(item?.value || "").toLowerCase().includes(needle)
    );
  }, [productTypeOptions, productTypeSearch]);

  const filteredUnitTypeOptions = useMemo(() => {
    const needle = String(unitTypeSearch || "").trim().toLowerCase();
    if (!needle) return unitTypeOptions;

    return unitTypeOptions.filter((item) =>
      String(item?.value || "").toLowerCase().includes(needle)
    );
  }, [unitTypeOptions, unitTypeSearch]);

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await adminPaquetesService.list();
      setPackagesRaw(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo cargar la lista de paquetes.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [pts, ptk] = await Promise.all([
          adminPaquetesService.getProductTypeCatalog(),
          adminPaquetesService.getUnitTypeCatalog(),
        ]);

        const nextPts = Array.isArray(pts) ? pts : [];
        const nextPtk = Array.isArray(ptk) ? ptk : [];

        setProductTypeOptions(nextPts);
        setUnitTypeOptions(nextPtk);

        setForm((prev) => {
          const next = { ...prev };
          if (nextPts.length > 0 && !nextPts.some((item) => String(item.key) === String(prev.product_type))) {
            next.product_type = String(nextPts[0].key);
          }
          if (nextPtk.length > 0 && !nextPtk.some((item) => String(item.key) === String(prev.unit_type))) {
            next.unit_type = String(nextPtk[0].key);
          }
          return next;
        });
      } catch (error) {
        toast.error(error?.response?.data?.message || "No se pudieron cargar los catalogos de EnviaTodo.");
      } finally {
        setLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, []);

  const onCreate = async (event) => {
    event.preventDefault();

    const cleanId = Number.parseInt(String(form.id || "").trim(), 10);
    if (!Number.isInteger(cleanId) || cleanId <= 0) {
      toast.error("El id del paquete debe ser un entero positivo.");
      return;
    }

    try {
      setWorkingAction("create");
      await adminPaquetesService.create({
        ...form,
        id: cleanId,
        default_pkg: form.default_pkg,
      });
      toast.success("Paquete creado correctamente.");
      setForm((prev) => ({ ...prev, id: "" }));
      await refreshList();
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo crear el paquete.");
    } finally {
      setWorkingAction("");
    }
  };

  const onSearchById = async () => {
    const cleanId = Number.parseInt(String(packageIdSearch || "").trim(), 10);
    if (!Number.isInteger(cleanId) || cleanId <= 0) {
      toast.error("Ingresa un ID valido para consultar.");
      return;
    }

    try {
      setWorkingAction("getById");
      const data = await adminPaquetesService.getById(cleanId);
      setPackageById(data);
    } catch (error) {
      setPackageById(null);
      toast.error(error?.response?.data?.message || "No se pudo consultar el paquete.");
    } finally {
      setWorkingAction("");
    }
  };

  const onDelete = async (packageId) => {
    if (!window.confirm(`Se eliminara el paquete #${packageId}. Deseas continuar?`)) {
      return;
    }

    try {
      setWorkingAction(`delete-${packageId}`);
      await adminPaquetesService.remove(packageId);
      toast.success(`Paquete #${packageId} eliminado.`);
      await refreshList();

      const selectedId = Number.parseInt(String(packageById?.id || packageById?.package_id || ""), 10);
      if (selectedId === Number(packageId)) {
        setPackageById(null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo eliminar el paquete.");
    } finally {
      setWorkingAction("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestionar Paquetes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administra paquetes de EnviaTodo para usarlos en la operacion de pedidos.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshList}
          disabled={loadingList}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <RefreshCw size={16} />
          Recargar
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onCreate} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <Plus size={18} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Crear paquete</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["id", "ID"],
              ["name", "Nombre"],
              ["package_content", "Contenido"],
              ["amount_pkg", "Monto"],
              ["height", "Alto"],
              ["width", "Ancho"],
              ["length", "Largo"],
              ["weight", "Peso"],
              ["real_weight", "Peso Real"],
              ["volumetric_weight", "Peso Volumetrico"],
              ["bill_weight", "Peso Facturable"],
            ].map(([field, label]) => (
              <label key={field} className={field === "package_content" ? "sm:col-span-2" : ""}>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
                <input
                  type="text"
                  value={form[field]}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder={label}
                  required={["id", "name", "product_type", "unit_type", "package_content"].includes(field)}
                />
              </label>
            ))}

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Product Type</span>
              <input
                type="text"
                value={productTypeSearch}
                onChange={(event) => setProductTypeSearch(event.target.value)}
                placeholder="Buscar por descripcion (value)"
                className="mb-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <select
                value={form.product_type}
                onChange={(event) => setForm((prev) => ({ ...prev, product_type: event.target.value }))}
                disabled={loadingCatalogs || productTypeOptions.length === 0}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
              >
                {productTypeOptions.length === 0 ? (
                  <option value="">{loadingCatalogs ? "Cargando..." : "Sin opciones"}</option>
                ) : filteredProductTypeOptions.length === 0 ? (
                  <option value="">Sin resultados para ese filtro</option>
                ) : (
                  filteredProductTypeOptions.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.key} - {item.value}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Unit Type</span>
              <input
                type="text"
                value={unitTypeSearch}
                onChange={(event) => setUnitTypeSearch(event.target.value)}
                placeholder="Buscar por descripcion (value)"
                className="mb-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <select
                value={form.unit_type}
                onChange={(event) => setForm((prev) => ({ ...prev, unit_type: event.target.value }))}
                disabled={loadingCatalogs || unitTypeOptions.length === 0}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
              >
                {unitTypeOptions.length === 0 ? (
                  <option value="">{loadingCatalogs ? "Cargando..." : "Sin opciones"}</option>
                ) : filteredUnitTypeOptions.length === 0 ? (
                  <option value="">Sin resultados para ese filtro</option>
                ) : (
                  filteredUnitTypeOptions.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.key} - {item.value}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>

          <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={Boolean(form.default_pkg)}
              onChange={(event) => setForm((prev) => ({ ...prev, default_pkg: event.target.checked }))}
            />
            Definir como paquete por defecto
          </label>

          <button
            type="submit"
            disabled={workingAction === "create"}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 font-semibold text-white transition hover:bg-black disabled:opacity-60"
          >
            <Plus size={16} />
            Crear paquete
          </button>
        </form>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center gap-2">
              <Search size={18} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Consultar por ID</h2>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={packageIdSearch}
                onChange={(event) => setPackageIdSearch(event.target.value)}
                placeholder="ID de paquete"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={onSearchById}
                disabled={workingAction === "getById"}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Buscar
              </button>
            </div>

            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-gray-900 p-3 text-xs text-emerald-300">
              {packageById ? JSON.stringify(packageById, null, 2) : "Sin consulta activa."}
            </pre>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">Lista de paquetes</h2>

            {loadingList ? (
              <p className="text-sm text-gray-500">Cargando paquetes...</p>
            ) : packagesList.length === 0 ? (
              <>
                <p className="text-sm text-gray-500">No se detecto un arreglo de paquetes en la respuesta.</p>
                <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-gray-900 p-3 text-xs text-sky-300">
                  {packagesRaw ? JSON.stringify(packagesRaw, null, 2) : "Sin datos"}
                </pre>
              </>
            ) : (
              <div className="max-h-96 space-y-2 overflow-auto">
                {packagesList.map((item, idx) => {
                  const packageId = getPackageId(item) || `idx-${idx}`;
                  const busy = workingAction === `delete-${packageId}`;

                  return (
                    <div
                      key={`${packageId}-${idx}`}
                      className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">#{packageId}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{getPackageName(item)}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDelete(packageId)}
                        disabled={busy || !getPackageId(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/40 dark:hover:bg-red-950/20"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}