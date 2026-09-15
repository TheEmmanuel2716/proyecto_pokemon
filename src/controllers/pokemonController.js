const repo = require('../data/pokemonRepository');

/**
 * GET /api/pokemons
 * Soporta busqueda opcional por nombre: /api/pokemons?nombre=pika
 * Soporta paginacion opcional: /api/pokemons?limit=20&offset=0
 */
function listar(req, res) {
  let pokemons = repo.obtenerTodos();

  const { nombre, limit, offset } = req.query;

  if (nombre) {
    pokemons = pokemons.filter((p) =>
      p.nombre.toLowerCase().includes(String(nombre).toLowerCase())
    );
  }

  const total = pokemons.length;

  if (limit !== undefined) {
    const off = Number(offset) || 0;
    const lim = Number(limit);
    pokemons = pokemons.slice(off, off + lim);
  }

  res.status(200).json({
    total,
    resultados: pokemons.length,
    data: pokemons
  });
}

/**
 * GET /api/pokemons/:id
 */
function obtener(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ mensaje: 'El id debe ser un numero entero.' });
  }

  const pokemon = repo.obtenerPorId(id);

  if (!pokemon) {
    return res
      .status(404)
      .json({ mensaje: `No se encontro un pokemon con id ${id}.` });
  }

  res.status(200).json({ data: pokemon });
}

/**
 * POST /api/pokemons
 */
function crear(req, res) {
  const { nombre } = req.body;

  if (repo.existeNombre(nombre)) {
    return res
      .status(409)
      .json({ mensaje: `Ya existe un pokemon con el nombre "${nombre}".` });
  }

  const nuevoPokemon = repo.crear(req.body);
  res.status(201).json({
    mensaje: 'Pokemon creado correctamente.',
    data: nuevoPokemon
  });
}

/**
 * PUT /api/pokemons/:id
 * PATCH /api/pokemons/:id
 */
function actualizar(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ mensaje: 'El id debe ser un numero entero.' });
  }

  const existente = repo.obtenerPorId(id);
  if (!existente) {
    return res
      .status(404)
      .json({ mensaje: `No se encontro un pokemon con id ${id}.` });
  }

  if (req.body.nombre && repo.existeNombre(req.body.nombre, id)) {
    return res.status(409).json({
      mensaje: `Ya existe otro pokemon con el nombre "${req.body.nombre}".`
    });
  }

  const actualizado = repo.actualizar(id, req.body);
  res.status(200).json({
    mensaje: 'Pokemon actualizado correctamente.',
    data: actualizado
  });
}

/**
 * DELETE /api/pokemons/:id
 */
function eliminar(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ mensaje: 'El id debe ser un numero entero.' });
  }

  const existente = repo.obtenerPorId(id);
  if (!existente) {
    return res
      .status(404)
      .json({ mensaje: `No se encontro un pokemon con id ${id}.` });
  }

  repo.eliminar(id);
  res.status(200).json({
    mensaje: `Pokemon con id ${id} eliminado correctamente.`
  });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
