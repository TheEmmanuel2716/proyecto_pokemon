const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const pokemonRoutes = require('./routes/pokemonRoutes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raiz - info basica de la API
app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'API REST - Pokemon 1ra Generacion',
    version: '1.0.0',
    endpoints: {
      listarTodos: 'GET /api/pokemons',
      buscarPorNombre: 'GET /api/pokemons?nombre=pika',
      paginacion: 'GET /api/pokemons?limit=10&offset=0',
      obtenerUno: 'GET /api/pokemons/:id',
      crear: 'POST /api/pokemons',
      actualizar: 'PUT /api/pokemons/:id o PATCH /api/pokemons/:id',
      eliminar: 'DELETE /api/pokemons/:id'
    }
  });
});

app.use('/api/pokemons', pokemonRoutes);

// 404 - ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

// Manejador de errores centralizado
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    mensaje: 'Ocurrio un error interno en el servidor.',
    error: err.message
  });
});

module.exports = app;
