// Taxonomía de errores del protocolo (API-13.2). Un intent ilegal se rechaza con un
// error tipado y NO modifica el estado (API-5.1). Nunca filtra información oculta (API-13.3).
export const ERROR_CODES = [
  "NOT_YOUR_PHASE", // intent fuera de la fase/sub-estado
  "NOT_AWAKE", // GR-5.9
  "ILLEGAL_CHOICE", // índice/opción inexistente
  "CANNOT_IGNORE", // GR-6.5 / GR-12.4
  "UNPAYABLE_COST", // GR-7.2
  "HELP_TOO_LATE", // GR-11.3
  "REQUIREMENT_NOT_MET", // CD-6
  "ALREADY_COMMITTED", // GR-5.12
  "RESOLUTION_IN_PROGRESS", // API-9.2
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
