// Resource (ARCH-3.3): recurso del almacén común (GR-7.3).
// Limitados por componente (GR-2.2, GR-7.10): 20 food, 12 wood, 8 stone.
export const RESOURCES = ["food", "wood", "stone"] as const;
export type ResourceKind = (typeof RESOURCES)[number];

// Contenido del almacén (Storage, GR-7.3).
export type ResourcePool = Record<ResourceKind, number>;
