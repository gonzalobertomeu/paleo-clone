// Identificadores opacos del protocolo (API-2, ARCH-9.3).
// Tipos nominales ligeros: strings con marca, para no confundir un GroupId con un CardId.

export type RoomCode = string & { readonly __brand: "RoomCode" };
export type PlayerId = string & { readonly __brand: "PlayerId" };
export type GroupId = string & { readonly __brand: "GroupId" };

// Clave de datos de una carta en el corpus (CD-2.1). No es el CD-* de spec.
export type CardId = string & { readonly __brand: "CardId" };
