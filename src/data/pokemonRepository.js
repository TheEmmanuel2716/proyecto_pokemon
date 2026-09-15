const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'pokemons.json');

/**
 * Repositorio de acceso a datos para los Pokemon.
 * Usa un archivo JSON como almacenamiento persistente (no requiere
 * levantar una base de datos externa, ideal para un proyecto de aula).
 */

function leerTodos() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function guardarTodos(pokemons) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(pokemons, null, 2), 'utf-8');
}

function obtenerTodos() {
  return leerTodos();
}

function obtenerPorId(id) {
  const pokemons = leerTodos();
  return pokemons.find((p) => p.id === Number(id));
}

function crear(nuevoPokemon) {
  const pokemons = leerTodos();
  const maxId = pokemons.reduce((max, p) => (p.id > max ? p.id : max), 0);
  const pokemon = {
    id: maxId + 1,
    nombre: nuevoPokemon.nombre,
    foto: nuevoPokemon.foto,
    tipo: nuevoPokemon.tipo || [],
    estadisticas: {
      ps: nuevoPokemon.estadisticas.ps,
      ataque: nuevoPokemon.estadisticas.ataque,
      defensa: nuevoPokemon.estadisticas.defensa,
      ataqueEspecial: nuevoPokemon.estadisticas.ataqueEspecial,
      defensaEspecial: nuevoPokemon.estadisticas.defensaEspecial,
      velocidad: nuevoPokemon.estadisticas.velocidad
    }
  };
  pokemons.push(pokemon);
  guardarTodos(pokemons);
  return pokemon;
}

function actualizar(id, datosActualizados) {
  const pokemons = leerTodos();
  const index = pokemons.findIndex((p) => p.id === Number(id));
  if (index === -1) return null;

  const actual = pokemons[index];
  const actualizado = {
    ...actual,
    nombre: datosActualizados.nombre ?? actual.nombre,
    foto: datosActualizados.foto ?? actual.foto,
    tipo: datosActualizados.tipo ?? actual.tipo,
    estadisticas: {
      ...actual.estadisticas,
      ...(datosActualizados.estadisticas || {})
    }
  };

  pokemons[index] = actualizado;
  guardarTodos(pokemons);
  return actualizado;
}

function eliminar(id) {
  const pokemons = leerTodos();
  const index = pokemons.findIndex((p) => p.id === Number(id));
  if (index === -1) return false;

  pokemons.splice(index, 1);
  guardarTodos(pokemons);
  return true;
}

function existeNombre(nombre, idAExcluir = null) {
  const pokemons = leerTodos();
  return pokemons.some(
    (p) =>
      p.nombre.toLowerCase() === nombre.toLowerCase() &&
      p.id !== Number(idAExcluir)
  );
}

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  existeNombre
};
