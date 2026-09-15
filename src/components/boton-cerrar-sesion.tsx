"use client";

/**
 * Cierra la sesión y devuelve al acceso.
 *
 * El `refresh()` es necesario: sin él, el panel podría seguir viéndose desde
 * la caché del router aunque la cookie ya no valga.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BotonCerrarSesion() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function cerrar() {
    setSaliendo(true);
    try {
      await authClient.signOut();
    } finally {
      router.replace("/area-cliente/acceso");
      router.refresh();
    }
  }

  return (
    <button className="button button-outline" type="button" onClick={cerrar} disabled={saliendo} aria-busy={saliendo}>
      {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  );
}
