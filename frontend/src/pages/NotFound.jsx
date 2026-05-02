import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-4 text-center">
      <div>
        <p className="text-sm uppercase tracking-widest text-slate-500">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Pagina no encontrada</h1>
        <Link to="/login" className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white">
          Ir al login
        </Link>
      </div>
    </div>
  );
}
