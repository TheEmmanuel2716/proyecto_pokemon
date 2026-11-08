const { primerJugador, calcularImpacto, resolverAccion } = require('../src/combate/motor');

const estadisticas = { ataque: 60, defensa: 60, ataqueEspecial: 100, defensaEspecial: 50, velocidad: 40 };
const fuego = { id: 'ascuas', nombre: 'Ascuas', tipo: 'Fire', categoria: 'especial', poder: 40, precision: 100 };
const placaje = { id: 'placaje', nombre: 'Placaje', tipo: 'Normal', categoria: 'fisico', poder: 35, precision: 95 };

function participante(jugador, tipos, cambios = {}) {
  return { jugador, tipos, estadisticas: { ...estadisticas, ...cambios }, psActuales: 100, psMaximos: 100 };
}

function azarNormal() {
  return 0.5;
}

test('ordena por velocidad y resuelve empates con el azar recibido', () => {
  const primero = participante(1, ['Normal']);
  const segundo = participante(2, ['Fire']);
  expect(primerJugador([primero, segundo], () => 0.49)).toBe(1);
  expect(primerJugador([primero, segundo], () => 0.5)).toBe(2);
  expect(primerJugador([primero, participante(2, ['Fire'], { velocidad: 41 })])).toBe(2);
});

test.each([
  ['neutral con STAB', ['Fire'], ['Normal'], 1.5, 1, 51],
  ['neutral sin STAB', ['Normal'], ['Normal'], 1, 1, 34],
  ['debilidad', ['Fire'], ['Grass'], 1.5, 2, 103],
  ['resistencia', ['Fire'], ['Water'], 1.5, 0.5, 25],
  ['debilidad doble', ['Fire'], ['Grass', 'Ice'], 1.5, 4, 206],
  ['debilidad compensada', ['Fire'], ['Grass', 'Water'], 1.5, 1, 51]
])('calcula daño especial para %s', (caso, tiposA, tiposB, stab, efectividad, danio) => {
  const impacto = calcularImpacto(participante(1, tiposA), participante(2, tiposB), fuego, azarNormal);
  expect(impacto).toEqual({ resultado: 'acierto', danio, critico: false, stab, efectividad });
});

test('usa las estadísticas físicas en Placaje', () => {
  const impacto = calcularImpacto(participante(1, ['Normal']), participante(2, ['Fire']), placaje, azarNormal);
  expect(impacto).toMatchObject({ danio: 24, stab: 1.5, efectividad: 1 });
});

test('aplica la probabilidad de crítico, el multiplicador y la variación', () => {
  const azar = jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(0.06249).mockReturnValueOnce(0);
  const impacto = calcularImpacto(participante(1, ['Fire']), participante(2, ['Normal']), fuego, azar);
  expect(impacto).toMatchObject({ critico: true, danio: 71 });
  const limite = jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(0.0625).mockReturnValueOnce(0);
  expect(calcularImpacto(participante(1, ['Fire']), participante(2, ['Normal']), fuego, limite).critico).toBe(false);
});

test('un fallo por precisión causa cero daño y consume la acción', () => {
  const participantes = [participante(1, ['Normal']), participante(2, ['Fire'])];
  const estado = { participantes, turno: 1, ronda: 1, jugadorActivo: 1, historial: [] };
  const siguiente = resolverAccion(estado, placaje, () => 0.95);
  expect(siguiente).toMatchObject({ turno: 2, jugadorActivo: 2, ronda: 1 });
  expect(siguiente.participantes).toEqual(participantes);
  expect(siguiente.historial[0]).toMatchObject({ resultado: 'fallo', danio: 0, psRestantes: 100 });
});

test('la inmunidad de primera generación domina al segundo tipo y al STAB', () => {
  const lengua = { tipo: 'Ghost', categoria: 'fisico', poder: 20, precision: 100 };
  const azar = jest.fn().mockReturnValue(0);
  const impacto = calcularImpacto(participante(1, ['Ghost']), participante(2, ['Psychic', 'Ghost']), lengua, azar);
  expect(impacto).toEqual({ resultado: 'inmune', danio: 0, critico: false, stab: 1.5, efectividad: 0 });
  expect(azar).toHaveBeenCalledTimes(1);
});

test('un acierto sin inmunidad quita al menos un PS', () => {
  const impacto = calcularImpacto(
    participante(1, ['Normal'], { ataqueEspecial: 0 }), participante(2, ['Water', 'Dragon']), fuego, azarNormal
  );
  expect(impacto).toMatchObject({ danio: 1, efectividad: 0.25 });
});

test('sortea el orden al comenzar una nueva ronda', () => {
  const participantes = [participante(1, ['Normal']), participante(2, ['Fire'])];
  const estado = { participantes, turno: 2, ronda: 1, jugadorActivo: 2, historial: [] };
  const azar = jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(0.5)
    .mockReturnValueOnce(0.5).mockReturnValueOnce(0.49);
  expect(resolverAccion(estado, placaje, azar)).toMatchObject({ turno: 3, ronda: 2, jugadorActivo: 1 });
});

test('limita el daño al PS restante y detiene el duelo en el primer ataque de la ronda', () => {
  const participantes = [participante(1, ['Fire']), { ...participante(2, ['Grass']), psActuales: 4 }];
  const estado = { participantes, turno: 1, ronda: 1, jugadorActivo: 1, historial: [] };
  const finalizado = resolverAccion(estado, fuego, azarNormal);
  expect(finalizado).toMatchObject({
    estado: 'finalizado', ganador: 1, jugadorActivo: null, turno: 2, ronda: 1,
    historial: [{ resultado: 'acierto', danio: 4, psRestantes: 0 }]
  });
  expect(finalizado.participantes[1].psActuales).toBe(0);
  expect(estado.participantes[1].psActuales).toBe(4);
});
