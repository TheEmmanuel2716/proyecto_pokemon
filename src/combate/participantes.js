const movimientosPorTipo = {
  Normal:   ['placaje', 'Placaje', 'fisico', 35, 95],
  Fire:     ['ascuas', 'Ascuas', 'especial', 40, 100],
  Water:    ['pistola-agua', 'Pistola Agua', 'especial', 40, 100],
  Electric: ['impactrueno', 'Impactrueno', 'especial', 40, 100],
  Grass:    ['latigo-cepa', 'Látigo Cepa', 'especial', 35, 100],
  Ice:      ['rayo-hielo', 'Rayo Hielo', 'especial', 95, 100],
  Fighting: ['patada-baja', 'Patada Baja', 'fisico', 50, 90],
  Poison:   ['picotazo-veneno', 'Picotazo Veneno', 'fisico', 15, 100],
  Ground:   ['terremoto', 'Terremoto', 'fisico', 100, 100],
  Flying:   ['ataque-ala', 'Ataque Ala', 'fisico', 35, 100],
  Psychic:  ['confusion', 'Confusión', 'especial', 50, 100],
  Bug:      ['chupavidas', 'Chupavidas', 'fisico', 20, 100],
  Rock:     ['lanzarrocas', 'Lanzarrocas', 'fisico', 50, 65],
  Ghost:    ['lenguetazo', 'Lengüetazo', 'fisico', 20, 100],
  Dragon:   ['furia-dragon', 'Furia Dragón', 'especial', 40, 100]
};

const tiposHistoricos = new Map([
  [35, { actual: ['Fairy'], historico: 'Normal' }],
  [36, { actual: ['Fairy'], historico: 'Normal' }],
  [39, { actual: ['Normal', 'Fairy'], historico: 'Normal' }],
  [40, { actual: ['Normal', 'Fairy'], historico: 'Normal' }],
  [81, { actual: ['Electric', 'Steel'], historico: 'Electric' }],
  [82, { actual: ['Electric', 'Steel'], historico: 'Electric' }],
  [122, { actual: ['Psychic', 'Fairy'], historico: 'Psychic' }]
]);

const minimos = {
  ps: 1,
  ataque: 0,
  defensa: 1,
  ataqueEspecial: 0,
  defensaEspecial: 1,
  velocidad: 0
};

function prepararParticipante(pokemon, jugador) {
  const { id, nombre, foto, tipo, estadisticas } = pokemon;
  if (typeof nombre !== 'string' || !nombre.trim()) {
    return { error: 'el nombre es obligatorio' };
  }

  if (!Array.isArray(tipo) || tipo.length < 1 || tipo.length > 2 ||
      new Set(tipo).size !== tipo.length || tipo.some((valor) => typeof valor !== 'string')) {
    return { error: 'se requieren uno o dos tipos distintos' };
  }
  const cambio = tiposHistoricos.get(id);
  const tipos = cambio && tipo.length === cambio.actual.length &&
    cambio.actual.every((valor) => tipo.includes(valor)) ? [cambio.historico] : [...tipo];
  if (tipos.some((valor) => !Object.hasOwn(movimientosPorTipo, valor))) {
    return { error: 'los tipos deben ser compatibles con la primera generación' };
  }

  const datos = {};
  for (const [campo, minimo] of Object.entries(minimos)) {
    const valor = estadisticas?.[campo];
    if (!Number.isSafeInteger(valor) || valor < minimo) {
      return { error: `la estadística ${campo} debe ser un entero seguro mayor o igual que ${minimo}` };
    }
    datos[campo] = valor;
  }

  const movimientos = [...new Set([...tipos, 'Normal', 'Water'])].map((valor) => {
    const [movimientoId, etiqueta, categoria, poder, precision] = movimientosPorTipo[valor];
    return { id: movimientoId, nombre: etiqueta, tipo: valor, categoria, poder, precision };
  });

  return {
    jugador,
    pokemonId: id,
    nombre,
    foto: typeof foto === 'string' && foto.trim() ? foto : null,
    tipos,
    estadisticas: datos,
    psMaximos: datos.ps,
    psActuales: datos.ps,
    movimientos
  };
}

module.exports = { prepararParticipante };
