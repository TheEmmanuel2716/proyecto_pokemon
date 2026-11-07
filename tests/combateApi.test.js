const fs = require('node:fs');
const request = require('supertest');
const { crearAppTemporal } = require('./fixtures/appTemporal');

describe('API de combates', () => {
  let entorno;
  let api;
  let catalogo;

  beforeAll(() => {
    entorno = crearAppTemporal();
    api = request(entorno.app);
    catalogo = fs.readFileSync(entorno.catalogo, 'utf-8');
  });

  afterEach(() => fs.writeFileSync(entorno.catalogo, catalogo));
  afterAll(() => entorno?.cerrar());

  function iniciar(pokemonIds) {
    return api.post('/api/combates').send({ pokemonIds });
  }

  test('crea un duelo a partir de dos Pokémon del catálogo y permite consultarlo', async () => {
    const creacion = await iniciar([4, 7]).expect(201);
    const estado = creacion.body.data;
    expect(estado).toMatchObject({ estado: 'en_curso', turno: 1, ronda: 1, jugadorActivo: 1, ganador: null });
    expect(estado.participantes).toMatchObject([
      { jugador: 1, pokemonId: 4, nombre: 'Charmander', tipos: ['Fire'], psActuales: 39, psMaximos: 39 },
      { jugador: 2, pokemonId: 7, nombre: 'Squirtle', tipos: ['Water'], psActuales: 44, psMaximos: 44 }
    ]);
    expect(estado.participantes[0].foto).toMatch(/^https:/);
    expect(estado.participantes[0].movimientos.map(({ id }) => id)).toEqual([
      'ascuas', 'placaje', 'pistola-agua'
    ]);
    expect(estado.participantes[1].movimientos.map(({ id }) => id)).toEqual([
      'pistola-agua', 'placaje'
    ]);
    const consulta = await api.get(creacion.headers.location).expect(200);
    expect(consulta.body.data).toEqual(estado);
  });

  test.each([
    [35, 'Normal'], [36, 'Normal'], [39, 'Normal'], [40, 'Normal'],
    [81, 'Electric'], [82, 'Electric'], [122, 'Psychic']
  ])('prepara el ID %i con su tipo histórico %s', async (id, tipo) => {
    const { body } = await iniciar([id, 4]).expect(201);
    expect(body.data.participantes[0].tipos).toEqual([tipo]);
    expect(body.data.participantes[0].movimientos).toEqual(
      expect.arrayContaining([expect.objectContaining({ tipo })])
    );
  });

  test('admite una imagen ausente y conserva los datos con que comenzó el duelo', async () => {
    const registros = JSON.parse(catalogo);
    delete registros.find(({ id }) => id === 4).foto;
    fs.writeFileSync(entorno.catalogo, JSON.stringify(registros));
    const { headers, body } = await iniciar([4, 7]).expect(201);
    expect(body.data.participantes[0].foto).toBeNull();

    await api.patch('/api/pokemons/4').send({ nombre: 'Otro', estadisticas: { ps: 100 } }).expect(200);
    const consulta = await api.get(headers.location).expect(200);
    expect(consulta.body.data).toEqual(body.data);
  });

  test('rechaza IDs inválidos, recursos inexistentes y JSON mal formado', async () => {
    await iniciar([0, 7]).expect(400);
    await iniciar(['4', 7]).expect(400);
    await iniciar([4]).expect(400);
    await iniciar([4, 9999]).expect(404);
    await api.get('/api/combates/desconocido').expect(404);
    await api.post('/api/combates').type('json').send('{"pokemonIds":').expect(400);
  });

  test('explica qué datos del Pokémon impiden combatir', async () => {
    const registros = JSON.parse(catalogo);
    delete registros.find(({ id }) => id === 4).tipo;
    registros.find(({ id }) => id === 7).estadisticas.defensa = 0;
    fs.writeFileSync(entorno.catalogo, JSON.stringify(registros));

    const sinTipo = await iniciar([4, 1]).expect(422);
    expect(sinTipo.body.mensaje).toMatch(/tipos/);
    const sinDefensa = await iniciar([7, 1]).expect(422);
    expect(sinDefensa.body.mensaje).toMatch(/defensa/);
  });

  test('comunica errores de lectura con un mensaje controlado', async () => {
    fs.writeFileSync(entorno.catalogo, '{');
    const { body } = await iniciar([4, 7]).expect(500);
    expect(body).toEqual({ mensaje: 'No se pudo consultar el catálogo. Intenta de nuevo.' });
  });

  test('completa un duelo, registra el daño e impide actuar después de la victoria', async () => {
    const azar = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    try {
      const { headers } = await iniciar([4, 7]).expect(201);
      const acciones = `${headers.location}/acciones`;

      const primero = await api.post(acciones).send({ movimientoId: 'ascuas', turno: 1 }).expect(200);
      expect(primero.body.data).toMatchObject({
        turno: 2,
        jugadorActivo: 2,
        historial: [{ movimientoId: 'ascuas', danio: 12, psRestantes: 32, efectividad: 0.5 }]
      });

      const final = await api.post(acciones).send({ movimientoId: 'pistola-agua', turno: 2 }).expect(200);
      expect(final.body.data).toMatchObject({
        estado: 'finalizado', ganador: 2, jugadorActivo: null, turno: 3,
        participantes: [{ psActuales: 0 }, { psActuales: 32 }]
      });
      expect(final.body.data.historial).toHaveLength(2);
      expect(final.body.data.historial[1]).toMatchObject({ resultado: 'acierto', danio: 39, efectividad: 2 });

      await api.post(acciones).send({ movimientoId: 'placaje', turno: 3 }).expect(409);
      const consulta = await api.get(headers.location).expect(200);
      expect(consulta.body).toEqual(final.body);
    } finally {
      azar.mockRestore();
    }
  });

  test('rechaza movimientos fuera del turno, turnos incorrectos y daño del cliente', async () => {
    const { headers, body } = await iniciar([4, 7]).expect(201);
    const acciones = `${headers.location}/acciones`;
    await api.post(acciones).send({ movimientoId: 'terremoto', turno: 1 }).expect(422);
    await api.post(acciones).send({ movimientoId: 'ascuas', turno: 2 }).expect(409);
    await api.post(acciones).send({ movimientoId: 'ascuas', turno: '1' }).expect(400);
    await api.post(acciones).send({ movimientoId: 'ascuas', turno: 1, danio: 999 }).expect(400);
    await api.post('/api/combates/desconocido/acciones').send({ movimientoId: 'ascuas', turno: 1 }).expect(404);
    const consulta = await api.get(headers.location).expect(200);
    expect(consulta.body).toEqual(body);
  });

  test('solo procesa una vez dos envíos concurrentes del mismo turno', async () => {
    const { headers } = await iniciar([4, 7]).expect(201);
    const acciones = `${headers.location}/acciones`;
    const enviar = () => api.post(acciones).send({ movimientoId: 'ascuas', turno: 1 });
    const respuestas = await Promise.all([enviar(), enviar()]);
    expect(respuestas.map(({ status }) => status).sort()).toEqual([200, 409]);
    const consulta = await api.get(headers.location).expect(200);
    expect(consulta.body.data).toMatchObject({ turno: 2, jugadorActivo: 2 });
    expect(consulta.body.data.historial).toHaveLength(1);
  });
});
