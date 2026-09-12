"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { services, site } from "@/content/site";
import { Icon } from "./icon";

export function Header() {
  const [panel, setPanel] = useState<"services" | "mobile" | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!panel) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPanel(null);
        (panel === "mobile" ? mobileRef : triggerRef).current?.focus();
      }
    }
    function onOutside(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setPanel(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [panel]);

  const close = () => setPanel(null);
  return (
    <header className="site-header" ref={headerRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
      <div className="utility-bar"><div className="container utility-inner">
        <span>Asesoría de transportes y formación en Gran Canaria</span>
        <a href={site.phoneHref}><Icon name="phone" />{site.phone}</a>
      </div></div>
      <div className="container nav-bar">
        <Link href="/" className="brand" aria-label="Takcanarias, inicio" onClick={close}>
          <Image src="/brand/takcanarias.svg" width={508} height={118} alt="Takcanarias" unoptimized />
          <span>ASESORÍA Y FORMACIÓN</span>
        </Link>
        <nav className="desktop-nav" aria-label="Navegación principal">
          <button ref={triggerRef} aria-expanded={panel === "services"} aria-controls="service-navigation" onClick={() => setPanel(panel === "services" ? null : "services")}>Nuestros servicios <Icon name="chevron" /></button>
          <Link href="/asesoria-transportes" aria-current={pathname === "/asesoria-transportes" ? "page" : undefined} onClick={close}>Tacógrafos</Link>
          <Link href="/autoescuela-takcanarias" aria-current={pathname === "/autoescuela-takcanarias" ? "page" : undefined} onClick={close}>Autoescuela</Link>
          <Link href="/deca" aria-current={pathname === "/deca" ? "page" : undefined} onClick={close}>DeCA</Link>
          <Link href="/contacto" aria-current={pathname === "/contacto" ? "page" : undefined} onClick={close}>Contacto</Link>
        </nav>
        <Link href="/area-cliente" className="client-access" onClick={close}><Icon name="user" />Área cliente<Icon name="external" /></Link>
        <button className="mobile-toggle" ref={mobileRef} aria-expanded={panel === "mobile"} aria-controls="mobile-navigation" onClick={() => setPanel(panel === "mobile" ? null : "mobile")}><span>{panel === "mobile" ? "Cerrar" : "Menú"}</span><Icon name={panel === "mobile" ? "close" : "menu"} /></button>
      </div>
      <div id="service-navigation" className="mega-panel" hidden={panel !== "services"}>
        <nav className="container mega-grid" aria-label="Todos los servicios">
          <div><h2>Transporte y empresa</h2>
            <Link href="/asesoria-transportes" onClick={close}><strong>Asesoría y tacógrafos</strong><span>Análisis, descarga y custodia de datos.</span></Link>
            <a href={site.cardDownload} target="_blank" rel="noopener noreferrer" onClick={close}><strong>Descarga de tarjeta · VDO</strong><span>Abrir Tachomat en otra pestaña.</span></a>
            <Link href="/plataforma-gps" onClick={close}><strong>Plataforma GPS</strong><span>Accede a la plataforma de Takcanarias.</span></Link>
            <Link href="/deca" onClick={close}><strong>DeCA · En preparación</strong><span>Documentación electrónica de transporte.</span></Link>
          </div>
          <div><h2>Formación y alumnos</h2>
            {services.slice(1).map((service) => <Link key={service.slug} href={`/${service.slug}`} onClick={close}><strong>{service.shortTitle}</strong><span>{service.summary}</span></Link>)}
            <Link href="/cursos" onClick={close}><strong>Aula online · En preparación</strong><span>Cursos, aprendizaje y asistencia.</span></Link>
          </div>
        </nav>
      </div>
      <nav id="mobile-navigation" className="mobile-panel" hidden={panel !== "mobile"} aria-label="Navegación móvil">
        <Link href="/" onClick={close}>Inicio</Link>
        {services.map((service) => <Link key={service.slug} href={`/${service.slug}`} onClick={close}>{service.shortTitle}<Icon name="arrow" /></Link>)}
        <Link href="/descarga-tarjeta" onClick={close}>Descarga de tarjeta</Link>
        <Link href="/plataforma-gps" onClick={close}>Plataforma GPS</Link>
        <Link href="/deca" onClick={close}>DeCA</Link>
        <Link href="/cursos" onClick={close}>Aula online</Link>
        <Link href="/area-cliente" onClick={close}>Área cliente</Link>
        <Link href="/contacto" onClick={close}>Contacto<Icon name="arrow" /></Link>
      </nav>
    </header>
  );
}
