/**
 * Aviso breve en pantalla («Datos restablecidos», «Demo vaciada»…). Sin React: es un pequeño
 * almacén al que se suscriben los componentes con useSyncExternalStore. Cada aviso desaparece
 * solo; uno nuevo sustituye al anterior y reinicia el plazo.
 */
export const NOTICE_MS = 3500;

let message: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeNotice(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNotice(): string | null {
  return message;
}

export function showNotice(text: string): void {
  message = text;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    message = null;
    timer = null;
    emit();
  }, NOTICE_MS);
  emit();
}

/** Solo para pruebas. */
export function __resetNoticeForTests(): void {
  if (timer) clearTimeout(timer);
  message = null;
  timer = null;
}
