const request = require('supertest');
const { crearAppTemporal } = require('./fixtures/appTemporal');

describe('API Pokemon - CRUD basico', () => {
  let entorno;
  let app;
  let idCreado;

  beforeAll(() => {
    entorno = crearAppTemporal();
    app = entorno.app;
  });

  afterAll(() => entorno?.cerrar());

  test('GET /api/pokemons -> debe listar los 151 pokemon iniciales o mas', async () => {
    const res = await request(app).get('/api/pokemons');
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(151);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/pokemons/1 -> debe retornar a Bulbasaur', async () => {
    const res = await request(app).get('/api/pokemons/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.nombre).toBe('Bulbasaur');
    expect(res.body.data.estadisticas).toHaveProperty('ps');
    expect(res.body.data.estadisticas).toHaveProperty('velocidad');
  });

  test('GET /api/pokemons/9999 -> debe retornar 404', async () => {
    const res = await request(app).get('/api/pokemons/9999');
    expect(res.statusCode).toBe(404);
  });

  test('POST /api/pokemons -> debe crear un pokemon nuevo', async () => {
    const nuevo = {
      nombre: 'TestMon',
      foto: 'https://example.com/testmon.png',
      tipo: ['Normal'],
      estadisticas: {
        ps: 50,
        ataque: 50,
        defensa: 50,
        ataqueEspecial: 50,
        defensaEspecial: 50,
        velocidad: 50
      }
    };

    const res = await request(app).post('/api/pokemons').send(nuevo);
    expect(res.statusCode).toBe(201);
    expect(res.body.data.nombre).toBe('TestMon');
    idCreado = res.body.data.id;
  });

  test('POST /api/pokemons -> debe fallar con datos incompletos', async () => {
    const res = await request(app)
      .post('/api/pokemons')
      .send({ nombre: 'Incompleto' });
    expect(res.statusCode).toBe(400);
  });

  test('PUT /api/pokemons/:id -> debe actualizar el pokemon creado', async () => {
    const res = await request(app)
      .put(`/api/pokemons/${idCreado}`)
      .send({ estadisticas: { velocidad: 99 } });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.estadisticas.velocidad).toBe(99);
  });

  test('DELETE /api/pokemons/:id -> debe eliminar el pokemon creado', async () => {
    const res = await request(app).delete(`/api/pokemons/${idCreado}`);
    expect(res.statusCode).toBe(200);

    const verificacion = await request(app).get(`/api/pokemons/${idCreado}`);
    expect(verificacion.statusCode).toBe(404);
  });
});
