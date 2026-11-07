const { randomUUID } = require('node:crypto');
const express = require('express');
const pokemonRepository = require('../data/pokemonRepository');
const { prepararParticipante } = require('../combate/participantes');

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

  const diferencia = participantes[0].estadisticas.velocidad - participantes[1].estadisticas.velocidad;
  const jugadorActivo = diferencia === 0 ? (Math.random() < 0.5 ? 1 : 2) : (diferencia > 0 ? 1 : 2);
  const combate = {
    id: randomUUID(),
    estado: 'en_curso',
    turno: 1,
    ronda: 1,
    jugadorActivo,
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
