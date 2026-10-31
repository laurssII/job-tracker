/**
 * Datos de ejemplo 100 % ficticios (empresas, personas y enlaces inventados) para probar
 * la app y para la futura demo pública. Las fechas son relativas a "hoy", así que el
 * panel siempre se ve actual.
 */
import type { Status, WorkMode } from "./constants";
import { addDays } from "./dates";
import type { ApplicationInput } from "./types";

export interface SeedItem {
  /** Datos de la solicitud, con su primer estado. */
  input: ApplicationInput;
  /** Cambios de estado posteriores, en orden cronológico. */
  changes: { status: Status; date: string; note: string | null }[];
}

interface Spec {
  company: string;
  role: string;
  location: string;
  workMode: WorkMode;
  contractType: string;
  salary: string | null;
  source: string;
  /** Hace cuántos días se envió. */
  daysAgo: number;
  /** Estados posteriores al primero: [estado, días tras el envío, nota]. */
  path?: [Status, number, string?][];
  /** Si es "pendiente", la solicitud aún no está enviada. */
  pending?: boolean;
  cv: string;
  contact?: string;
  nextAction?: [string, number]; // [texto, días respecto a hoy]
  notes?: string;
}

const SPECS: Spec[] = [
  {
    company: "Nubelia Systems", role: "Desarrollador/a Full Stack", location: "Madrid", workMode: "hibrido",
    contractType: "Indefinido", salary: "32-38k €", source: "LinkedIn", daysAgo: 41, cv: "CV Full Stack v3",
    contact: "Marta Rey",
    path: [["respondida", 3], ["entrevista", 9, "Entrevista con RRHH"], ["prueba_tecnica", 16, "Reto de 3 horas con React y Node"], ["rechazada", 27, "Han elegido un perfil con más experiencia"]],
  },
  {
    company: "Atlántica Digital", role: "Frontend Developer (React)", location: "Remoto (España)", workMode: "remoto",
    contractType: "Indefinido", salary: "35-42k €", source: "LinkedIn", daysAgo: 38, cv: "CV Frontend v2",
    contact: "Luis Soto", notes: "Buen equipo y producto interesante. Pedir más detalle sobre el plan de formación.",
    path: [["respondida", 2], ["entrevista", 8, "Entrevista técnica"], ["oferta", 21, "Oferta: 39k € + seguro médico"]],
    nextAction: ["Responder a la oferta", 2],
  },
  {
    company: "Brisa Labs", role: "Backend Developer (Node.js)", location: "Barcelona", workMode: "hibrido",
    contractType: "Indefinido", salary: "34-40k €", source: "Web de la empresa", daysAgo: 35, cv: "CV Backend v1",
    path: [["sin_respuesta", 30, "Sin noticias tras el mensaje de seguimiento"]],
  },
  {
    company: "Cobalto Software", role: "Desarrollador/a Python", location: "Valencia", workMode: "presencial",
    contractType: "Indefinido", salary: "28-32k €", source: "InfoJobs", daysAgo: 33, cv: "CV Backend v1",
    path: [["rechazada", 12, "Rechazo automático por email"]],
  },
  {
    company: "Mareas Tech", role: "DevOps Engineer", location: "Remoto (España)", workMode: "remoto",
    contractType: "Indefinido", salary: "40-48k €", source: "LinkedIn", daysAgo: 30, cv: "CV DevOps v1",
    contact: "Elena Prado",
    path: [["respondida", 4], ["entrevista", 11], ["prueba_tecnica", 18, "Prueba de Terraform y CI/CD"], ["rechazada", 26, "Piden más experiencia con Kubernetes"]],
  },
  {
    company: "Pixelforge Studio", role: "Frontend Developer", location: "Bilbao", workMode: "hibrido",
    contractType: "Temporal", salary: "26-30k €", source: "Indeed", daysAgo: 29, cv: "CV Frontend v2",
    path: [["sin_respuesta", 22]],
  },
  {
    company: "Norte Analytics", role: "Ingeniero/a de Datos", location: "Madrid", workMode: "hibrido",
    contractType: "Indefinido", salary: "38-45k €", source: "Referido", daysAgo: 27, cv: "CV Datos v1",
    contact: "Raúl Vega", notes: "Me recomendó un excompañero. Stack: Python, Airflow y dbt.",
    path: [["respondida", 1], ["entrevista", 5], ["prueba_tecnica", 12, "Ejercicio de modelado de datos"], ["entrevista", 19, "Entrevista final con el equipo"]],
    nextAction: ["Preparar la entrevista final: repasar Airflow", 3],
  },
  {
    company: "Lumen Fintech", role: "Backend Developer (Java)", location: "Madrid", workMode: "presencial",
    contractType: "Indefinido", salary: "36-42k €", source: "LinkedIn", daysAgo: 26, cv: "CV Backend v1",
    path: [["rechazada", 9]],
  },
  {
    company: "Verdecode", role: "Desarrollador/a Full Stack", location: "Remoto (España)", workMode: "remoto",
    contractType: "Freelance", salary: "A convenir", source: "Web de la empresa", daysAgo: 24, cv: "CV Full Stack v3",
    contact: "Ana Cabrera",
    path: [["respondida", 6], ["entrevista", 13, "Llamada de 45 min con la CTO"]],
    nextAction: ["Enviar email de seguimiento", -1],
  },
  {
    company: "Horizonte Cloud", role: "DevOps Engineer", location: "Sevilla", workMode: "hibrido",
    contractType: "Indefinido", salary: "36-44k €", source: "InfoJobs", daysAgo: 23, cv: "CV DevOps v1",
    path: [["sin_respuesta", 19]],
  },
  {
    company: "Kiwano Apps", role: "Mobile Developer (React Native)", location: "Remoto (España)", workMode: "remoto",
    contractType: "Indefinido", salary: "32-38k €", source: "LinkedIn", daysAgo: 21, cv: "CV Frontend v2",
    path: [["respondida", 2], ["rechazada", 7, "Buscaban más experiencia en apps nativas"]],
  },
  {
    company: "Tramontana IT", role: "QA Automation Engineer", location: "Barcelona", workMode: "presencial",
    contractType: "Indefinido", salary: "28-33k €", source: "Indeed", daysAgo: 20, cv: "CV Backend v1",
    path: [["sin_respuesta", 17]],
  },
  {
    company: "Aurora Health Tech", role: "Backend Developer (Python)", location: "Remoto (España)", workMode: "remoto",
    contractType: "Indefinido", salary: "34-40k €", source: "Referido", daysAgo: 18, cv: "CV Backend v1",
    contact: "Irene Lago",
    path: [["respondida", 2], ["entrevista", 7, "Entrevista técnica sobre APIs y bases de datos"]],
  },
  {
    company: "Sierra Logística Digital", role: "Desarrollador/a Full Stack", location: "Valencia", workMode: "hibrido",
    contractType: "Indefinido", salary: "30-36k €", source: "LinkedIn", daysAgo: 17, cv: "CV Full Stack v3",
    path: [["respondida", 4, "Piden disponibilidad para una llamada"]],
  },
  {
    company: "Faro Cybersecurity", role: "Analista de Datos Junior", location: "Madrid", workMode: "presencial",
    contractType: "Prácticas", salary: "1.000 €/mes", source: "InfoJobs", daysAgo: 16, cv: "CV Datos v1",
    path: [["rechazada", 5]],
  },
  {
    company: "Olivar Retail Tech", role: "Frontend Developer", location: "Remoto (España)", workMode: "remoto",
    contractType: "Indefinido", salary: "33-39k €", source: "LinkedIn", daysAgo: 15, cv: "CV Frontend v2",
  },
  {
    company: "Gaviota Software", role: "Desarrollador/a Java", location: "Bilbao", workMode: "hibrido",
    contractType: "Indefinido", salary: "32-37k €", source: "Web de la empresa", daysAgo: 14, cv: "CV Backend v1",
  },
  {
    company: "Delta Mobility", role: "Backend Developer (Node.js)", location: "Barcelona", workMode: "hibrido",
    contractType: "Indefinido", salary: "36-42k €", source: "LinkedIn", daysAgo: 12, cv: "CV Backend v1",
    path: [["respondida", 3]],
  },
  {
    company: "Raíz Educación Online", role: "Desarrollador/a Full Stack", location: "Remoto (España)", workMode: "remoto",
    contractType: "Temporal", salary: "28-32k €", source: "Indeed", daysAgo: 11, cv: "CV Full Stack v3",
  },
  {
    company: "Corriente Energía Digital", role: "Ingeniero/a de Datos", location: "Madrid", workMode: "presencial",
    contractType: "Indefinido", salary: "37-43k €", source: "LinkedIn", daysAgo: 9, cv: "CV Datos v1",
    path: [["respondida", 2], ["entrevista", 6, "Entrevista con el responsable de datos"]],
  },
  {
    company: "Mistral Games", role: "Frontend Developer", location: "Remoto (España)", workMode: "remoto",
    contractType: "Indefinido", salary: "30-36k €", source: "Web de la empresa", daysAgo: 7, cv: "CV Frontend v2",
  },
  {
    company: "Quimera Robotics", role: "Desarrollador/a Python", location: "Valencia", workMode: "presencial",
    contractType: "Indefinido", salary: "34-39k €", source: "Referido", daysAgo: 5, cv: "CV Backend v1",
    path: [["respondida", 2]],
  },
  {
    company: "Alba Insurtech", role: "Desarrollador/a Full Stack", location: "Madrid", workMode: "hibrido",
    contractType: "Indefinido", salary: "35-41k €", source: "LinkedIn", daysAgo: 3, cv: "CV Full Stack v3",
  },
  {
    company: "Tejado Proptech", role: "Frontend Developer", location: "Remoto (España)", workMode: "remoto",
    contractType: "Indefinido", salary: null, source: "LinkedIn", daysAgo: 1, cv: "CV Frontend v2",
  },
  {
    company: "Aurelia Pay", role: "Backend Developer (Node.js)", location: "Sevilla", workMode: "hibrido",
    contractType: "Indefinido", salary: "35-40k €", source: "LinkedIn", daysAgo: 0, cv: "CV Backend v1",
    pending: true, nextAction: ["Enviar el CV antes de que cierren la oferta", 2],
    notes: "Oferta guardada para enviar con una carta de presentación adaptada.",
  },
  {
    company: "Kestrel Cloud", role: "DevOps Engineer", location: "Remoto (España)", workMode: "remoto",
    contractType: "Indefinido", salary: "42-50k €", source: "LinkedIn", daysAgo: 0, cv: "CV DevOps v1",
    pending: true,
  },
];

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function emailFor(name: string, company: string): string {
  return `${slug(name).replace(/-/g, ".")}@${slug(company)}.example.com`;
}

export function buildSeed(today: string): SeedItem[] {
  return SPECS.map((spec) => {
    const appliedAt = addDays(today, -spec.daysAgo);
    const input: ApplicationInput = {
      company: spec.company,
      role: spec.role,
      url: `https://example.com/empleo/${slug(spec.company)}/${slug(spec.role)}`,
      location: spec.location,
      workMode: spec.workMode,
      contractType: spec.contractType,
      salary: spec.salary,
      source: spec.source,
      appliedAt,
      status: spec.pending ? "pendiente" : "enviada",
      contactName: spec.contact ?? null,
      contactEmail: spec.contact ? emailFor(spec.contact, spec.company) : null,
      cvVersion: spec.cv,
      notes: spec.notes ?? null,
      nextAction: spec.nextAction?.[0] ?? null,
      nextActionDate: spec.nextAction ? addDays(today, spec.nextAction[1]) : null,
    };
    const changes = (spec.path ?? []).map(([status, daysAfter, note]) => ({
      status,
      date: addDays(appliedAt, daysAfter),
      note: note ?? null,
    }));
    return { input, changes };
  });
}
