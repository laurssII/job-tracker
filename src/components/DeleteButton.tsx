"use client";

export function DeleteButton({ action, company }: { action: () => Promise<void>; company: string }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`¿Eliminar la solicitud a ${company}? Se borrará también su historial.`)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
      >
        Eliminar
      </button>
    </form>
  );
}
