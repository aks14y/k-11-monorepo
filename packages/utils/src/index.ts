export const emitCustomEvent = <T>(name: string, detail: T) => {
  window.dispatchEvent(new CustomEvent<T>(name, { detail }));
};

export const listenCustomEvent = <T>(
  name: string,
  handler: (detail: T) => void
): (() => void) => {
  const listener = (event: Event) => {
    handler((event as CustomEvent<T>).detail);
  };
  window.addEventListener(name, listener as EventListener);
  return () => window.removeEventListener(name, listener as EventListener);
};

