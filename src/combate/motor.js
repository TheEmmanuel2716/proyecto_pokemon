const nivel = 50;
const probabilidadCritico = 0.0625;
const multiplicadorCritico = 1.5;

// Las parejas que no aparecen son neutrales en Pokémon Rojo.
const efectividadPorTipo = {
  Normal: { Rock: 0.5, Ghost: 0 },
  Fire: { Grass: 2, Ice: 2, Fire: 0.5, Water: 0.5, Bug: 2, Rock: 0.5, Dragon: 0.5 },
  Water: { Fire: 2, Rock: 2, Water: 0.5, Grass: 0.5, Ground: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Water: 2, Grass: 0.5, Fire: 0.5, Ground: 2, Bug: 0.5, Poison: 0.5, Rock: 2, Flying: 0.5, Dragon: 0.5 },
  Ice: { Ice: 0.5, Water: 0.5, Grass: 2, Ground: 2, Flying: 2, Dragon: 2 },
  Fighting: { Normal: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ice: 2, Ghost: 0 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Bug: 2, Rock: 0.5, Ghost: 0.5 },
  Ground: { Flying: 0, Fire: 2, Electric: 2, Grass: 0.5, Bug: 0.5, Rock: 2, Poison: 2 },
  Flying: { Electric: 0.5, Fighting: 2, Bug: 2, Grass: 2, Rock: 0.5 },
  Psychic: { Psychic: 0.5, Fighting: 2, Poison: 2 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Poison: 2 },
  Rock: { Fire: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Ice: 2 },
  Ghost: { Ghost: 2, Normal: 0, Psychic: 0 },
  Dragon: { Dragon: 2 }
};

function primerJugador(participantes, azar = Math.random) {
  const [primero, segundo] = participantes;
  const diferencia = primero.estadisticas.velocidad - segundo.estadisticas.velocidad;
  if (diferencia === 0) return azar() < 0.5 ? primero.jugador : segundo.jugador;
  return diferencia > 0 ? primero.jugador : segundo.jugador;
}

function calcularImpacto(atacante, defensor, movimiento, azar = Math.random) {
  if (azar() * 100 >= movimiento.precision) {
    return { resultado: 'fallo', danio: 0, critico: false, stab: null, efectividad: null };
  }

  const stab = atacante.tipos.includes(movimiento.tipo) ? 1.5 : 1;
  const tabla = efectividadPorTipo[movimiento.tipo];
  const efectividad = defensor.tipos.reduce((factor, tipo) => factor * (tabla[tipo] ?? 1), 1);
  if (efectividad === 0) {
    return { resultado: 'inmune', danio: 0, critico: false, stab, efectividad };
  }

  const esEspecial = movimiento.categoria === 'especial';
  const ataque = atacante.estadisticas[esEspecial ? 'ataqueEspecial' : 'ataque'];
  const defensa = defensor.estadisticas[esEspecial ? 'defensaEspecial' : 'defensa'];
  const base = ((2 * nivel / 5 + 2) * movimiento.poder * ataque / defensa) / 50 + 2;
  const critico = azar() < probabilidadCritico;
  const variacion = 0.85 + azar() * 0.15;
  const modificadores = stab * efectividad * variacion * (critico ? multiplicadorCritico : 1);
  const danio = Math.max(1, Math.trunc(base * modificadores));

  return { resultado: 'acierto', danio, critico, stab, efectividad };
}

function resolverAccion(combate, movimiento, azar = Math.random) {
  const { turno, ronda, jugadorActivo } = combate;
  const atacante = combate.participantes[jugadorActivo - 1];
  const defensor = combate.participantes[2 - jugadorActivo];
  const impacto = calcularImpacto(atacante, defensor, movimiento, azar);
  const danio = Math.min(impacto.danio, defensor.psActuales);
  const psActuales = defensor.psActuales - danio;
  const participantes = combate.participantes.map((participante) =>
    participante === defensor ? { ...defensor, psActuales } : participante
  );
  const terminado = psActuales === 0;
  const nuevaRonda = !terminado && turno % 2 === 0;
  let siguiente = null;
  if (!terminado) {
    siguiente = nuevaRonda ? primerJugador(participantes, azar) : defensor.jugador;
  }
  const evento = {
    ...impacto,
    danio,
    turno,
    ronda,
    jugador: atacante.jugador,
    objetivo: defensor.jugador,
    movimientoId: movimiento.id,
    movimiento: movimiento.nombre,
    psRestantes: psActuales
  };

  return {
    ...combate,
    estado: terminado ? 'finalizado' : 'en_curso',
    turno: turno + 1,
    ronda: ronda + Number(nuevaRonda),
    jugadorActivo: siguiente,
    participantes,
    historial: [...combate.historial, evento],
    ganador: terminado ? atacante.jugador : null
  };
}

module.exports = { primerJugador, calcularImpacto, resolverAccion };
