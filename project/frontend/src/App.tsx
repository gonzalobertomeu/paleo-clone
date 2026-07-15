// Presenta el estado que emite el backend y envía intenciones del jugador (ARCH-1.3).
// No duplica lógica de reglas: la validación real siempre es del backend.
// TODO(FE-*): cliente tRPC sobre WS (API-1), suscripción de partida y vistas.
export function App(): JSX.Element {
  return (
    <main>
      <h1>Paleo</h1>
      <p>Scaffolding listo. Cliente pendiente (Frontend.md, FE-*).</p>
    </main>
  );
}
