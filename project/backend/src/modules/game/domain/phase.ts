// Fases y sub-estados de la máquina de estados (BE-5). El GameState lleva un
// discriminante `phase` y, dentro, un `subState`. Toda transición la dispara un
// comando o un paso de servidor; nunca un cliente (BE-5, ARCH-1.3).
export type Phase = "day" | "night" | "newDay" | "ended";

export type DaySubState = "choosing" | "resolving"; // BE-5.2
export type NightSubState = "feeding" | "missions"; // BE-5.7
