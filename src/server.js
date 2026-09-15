const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentacion rapida: http://localhost:${PORT}/`);
  console.log(`Endpoint principal: http://localhost:${PORT}/api/pokemons`);
});
