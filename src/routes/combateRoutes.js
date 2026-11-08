const { randomUUID } = require('node:crypto');
const express = require('express');
const pokemonRepository = require('../data/pokemonRepository');
const { prepararParticipante } = require('../combate/participantes');
const { primerJugador, resolverAccion } = require('../combate/motor');

const router = express.Router();
const combates = new Map();

router.use(express.json());

router.post('/', (req, res) => {
  const { pokemonIds } = req.body ?? {};
  if (!Array.isArray(pokemonIds) || pokemonIds.length !== 2 ||
      !pokemonIds.every((id) => Number.isSafeInteger(id) && id > 0)) {
    return res.status(400).json({ mensaje: 'Envía dos IDs de Pokémon enteros y positivos en pokemonIds.' });
  }

  let catalogo;
  try {
    catalogo = pokemonRepository.obtenerTodos();
    if (!Array.isArray(catalogo)) throw new Error('El catálogo debe ser una lista.');
  } catch {
    return res.status(500).json({ mensaje: 'No se pudo consultar el catálogo. Intenta de nuevo.' });
  }

  const participantes = [];
  for (const [posicion, id] of pokemonIds.entries()) {
    const pokemon = catalogo.find((registro) => registro?.id === id);
    if (!pokemon) return res.status(404).json({ mensaje: `No existe un Pokémon con ID ${id}.` });

    const participante = prepararParticipante(pokemon, posicion + 1);
    if (participante.error) {
      return res.status(422).json({ mensaje: `Pokémon con ID ${id}: ${participante.error}.` });
    }
    participantes.push(participante);
  }

  const combate = {
    id: randomUUID(),
    estado: 'en_curso',
    turno: 1,
    ronda: 1,
    jugadorActivo: primerJugador(participantes),
    participantes,
    historial: [],
    ganador: null
  };
  combates.set(combate.id, combate);
  return res.status(201).location(`/api/combates/${combate.id}`).json({ data: combate });
});

router.get('/:id', (req, res) => {
  const combate = combates.get(req.params.id);
  if (!combate) return res.status(404).json({ mensaje: 'No se encontró el combate.' });
  return res.json({ data: combate });
});

router.post('/:id/acciones', (req, res) => {
  const datos = req.body ?? {};
  const { movimientoId, turno } = datos;
  if (Object.keys(datos).length !== 2 || typeof movimientoId !== 'string' || !movimientoId.trim() ||
      !Number.isSafeInteger(turno) || turno < 1) {
    return res.status(400).json({ mensaje: 'Envía únicamente un movimientoId y un número de turno válido.' });
  }

  const combate = combates.get(req.params.id);
  if (!combate) return res.status(404).json({ mensaje: 'No se encontró el combate.' });
  if (combate.estado === 'finalizado') {
    return res.status(409).json({ mensaje: 'El combate ya finalizó.' });
  }
  if (turno !== combate.turno) {
    return res.status(409).json({ mensaje: 'El número de turno ya no coincide. Consulta el estado actual.' });
  }

  const atacante = combate.participantes[combate.jugadorActivo - 1];
  const movimiento = atacante.movimientos.find(({ id }) => id === movimientoId);
  if (!movimiento) {
    return res.status(422).json({ mensaje: 'El movimiento no está disponible para el Pokémon del turno.' });
  }

  const actualizado = resolverAccion(combate, movimiento);
  combates.set(actualizado.id, actualizado);
  return res.json({ data: actualizado });
});

router.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la petición debe ser JSON válido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ mensaje: 'El cuerpo de la petición es demasiado grande.' });
  }
  return next(error);
});

module.exports = router;
