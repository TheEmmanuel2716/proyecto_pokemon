const express = require('express');
const controller = require('../controllers/pokemonController');
const {
  validarCreacion,
  validarActualizacion
} = require('../middlewares/validarPokemon');

const router = express.Router();

// GET /api/pokemons          -> listar todos (con filtros opcionales)
// GET /api/pokemons/:id      -> obtener uno por id
// POST /api/pokemons         -> crear uno nuevo
// PUT /api/pokemons/:id      -> actualizar (total o parcial)
// PATCH /api/pokemons/:id    -> actualizar (parcial)
// DELETE /api/pokemons/:id   -> eliminar

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', validarCreacion, controller.crear);
router.put('/:id', validarActualizacion, controller.actualizar);
router.patch('/:id', validarActualizacion, controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;
