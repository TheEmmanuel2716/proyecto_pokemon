# Pokemon API - Proyecto de Aula

API REST construida en **Node.js + Express** que implementa un CRUD completo
sobre los 151 Pokemon de la primera generacion. Cada Pokemon incluye:

- Nombre
- Foto (URL de la imagen oficial)
- Las seis estadisticas principales: PS, Ataque, Defensa, Ataque Especial,
  Defensa Especial y Velocidad

Este proyecto es la base sobre la cual se construiran las practicas de
pruebas de software del curso.

## Tecnologias

- Node.js
- Express
- Almacenamiento en archivo JSON
- Jest + Supertest para pruebas automatizadas

## Estructura del proyecto

```
proyecto_pokemon/
├── src/
│   ├── controllers/
│   │   └── pokemonController.js   # Logica de cada endpoint
│   ├── data/
│   │   ├── pokemonRepository.js   # Acceso a datos (lectura/escritura del JSON)
│   │   └── pokemons.json          # "Base de datos" con los 151 pokemon
│   ├── middlewares/
│   │   └── validarPokemon.js      # Validaciones de entrada
│   ├── routes/
│   │   └── pokemonRoutes.js       # Definicion de rutas
│   ├── app.js                     # Configuracion de Express
│   └── server.js                  # Punto de entrada (levanta el servidor)
├── tests/
│   └── pokemon.test.js            # Pruebas automatizadas del CRUD
├── requests.http                  # Coleccion de peticiones de ejemplo
├── package.json
└── README.md
```

## Requisitos previos

- Node.js 18 o superior
- pnpm

## Instalacion

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd proyecto_pokemon

# 2. Instalar dependencias
pnpm install
```

## Ejecucion

```bash
# Modo normal
pnpm start

# Modo desarrollo (recarga automatica con nodemon)
pnpm run dev
```

El servidor quedara disponible en `http://localhost:3000`.

Puedes cambiar el puerto usando la variable de entorno `PORT`:

```bash
PORT=4000 pnpm start
```

## Endpoints disponibles

Todas las respuestas y peticiones usan formato **JSON**.

| Metodo | Endpoint                          | Descripcion                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| GET    | `/`                               | Informacion basica de la API                 |
| GET    | `/api/pokemons`                   | Lista todos los pokemon                      |
| GET    | `/api/pokemons?nombre=pika`       | Filtra pokemon por nombre (busqueda parcial) |
| GET    | `/api/pokemons?limit=10&offset=0` | Pagina los resultados                        |
| GET    | `/api/pokemons/:id`               | Obtiene un pokemon por id                    |
| POST   | `/api/pokemons`                   | Crea un nuevo pokemon                        |
| PUT    | `/api/pokemons/:id`               | Actualiza un pokemon (total o parcial)       |
| PATCH  | `/api/pokemons/:id`               | Actualiza un pokemon parcialmente            |
| DELETE | `/api/pokemons/:id`               | Elimina un pokemon                           |

### Estructura de un Pokemon

```json
{
  "id": 1,
  "nombre": "Bulbasaur",
  "foto": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
  "tipo": ["Grass", "Poison"],
  "estadisticas": {
    "ps": 45,
    "ataque": 49,
    "defensa": 49,
    "ataqueEspecial": 65,
    "defensaEspecial": 65,
    "velocidad": 45
  }
}
```

### Ejemplo - Crear un pokemon (POST /api/pokemons)

Body:

```json
{
  "nombre": "Mewtwo Clon",
  "foto": "https://ejemplo.com/mewtwo.png",
  "tipo": ["Psychic"],
  "estadisticas": {
    "ps": 106,
    "ataque": 110,
    "defensa": 90,
    "ataqueEspecial": 154,
    "defensaEspecial": 90,
    "velocidad": 130
  }
}
```

Respuesta (201 Created):

```json
{
  "mensaje": "Pokemon creado correctamente.",
  "data": {
    "id": 152,
    "nombre": "Mewtwo Clon",
    "foto": "https://ejemplo.com/mewtwo.png",
    "tipo": ["Psychic"],
    "estadisticas": {
      "ps": 106,
      "ataque": 110,
      "defensa": 90,
      "ataqueEspecial": 154,
      "defensaEspecial": 90,
      "velocidad": 130
    }
  }
}
```

### Codigos de estado usados

- `200 OK` - Operacion exitosa (GET, PUT, PATCH, DELETE)
- `201 Created` - Recurso creado exitosamente (POST)
- `400 Bad Request` - Datos invalidos o incompletos en la peticion
- `404 Not Found` - El pokemon solicitado no existe
- `409 Conflict` - Ya existe un pokemon con ese nombre
- `500 Internal Server Error` - Error inesperado del servidor

## Probar la API

Puedes probar los endpoints de tres formas:

1. **Archivo `requests.http`**: si usas VS Code con la extension
   "REST Client", abre el archivo y haz clic en "Send Request" sobre cada
   peticion.
2. **Postman / Insomnia**: importa las rutas manualmente usando la tabla de
   endpoints de arriba.
3. **curl**, por ejemplo:

```bash
curl http://localhost:3000/api/pokemons/1
```

## Pruebas automatizadas

El proyecto incluye pruebas con Jest y Supertest sobre el CRUD:

```bash
pnpm test
```

Estas pruebas cubren: listar, obtener por id, crear, validar datos
invalidos, actualizar y eliminar. Sirven como punto de partida para las
practicas de pruebas de software del curso.

## Módulo de combate

Dos jugadores comparten una pantalla y eligen un Pokémon del catálogo para cada lado. Para jugar desde una copia limpia del proyecto, instala las dependencias y arranca el servidor.

```bash
pnpm install --frozen-lockfile
pnpm start
```

Abre [la arena de combate](http://localhost:3000/combate/). Elige a Charmander y Squirtle y presiona **Iniciar duelo**. Usa **Ascuas** en el turno de Charmander y **Pistola Agua** en el de Squirtle. La arena muestra los PS tras cada jugada, la efectividad del ataque y el ganador. Selecciona **Nuevo duelo** para volver a jugar.

### Arquitectura

Express sirve la interfaz estática y la API de combate desde el mismo proceso. Así, la pantalla puede usar el catálogo existente y enviar jugadas al servidor sin agregar otro servicio ni nuevas dependencias. El motor calcula el resultado a partir de los participantes, el movimiento validado y una fuente de azar que se puede controlar en las pruebas.

Al crear el duelo, el servidor copia los datos que necesita de los dos registros. Cada participante tiene un número de jugador, el ID del catálogo, nombre, foto opcional, tipos, estadísticas, PS máximos y actuales y movimientos disponibles. Las estadísticas deben ser enteros seguros. Los PS y ambas defensas deben ser positivos, y el ataque, el ataque especial y la velocidad pueden ser cero. El estado de cada duelo se guarda en memoria y se pierde al reiniciar el servidor.

### API del combate

| Método y ruta | Entrada y resultado |
| --- | --- |
| `POST /api/combates` | Recibe `{"pokemonIds":[4,7]}`. Devuelve `201`, el estado inicial y la ruta de consulta en `Location`. |
| `GET /api/combates/:id` | Devuelve `200` y el estado actual. |
| `POST /api/combates/:id/acciones` | Recibe `{"movimientoId":"ascuas","turno":1}`. Devuelve `200` y el estado actualizado. |

El objeto `data` incluye `id`, `estado`, `ronda`, `turno`, `jugadorActivo`, `participantes`, `historial` y `ganador`. Los dos números de jugador son 1 y 2. `jugadorActivo` vale `null` al finalizar y `ganador` vale `null` mientras el duelo sigue en curso.

Los errores incluyen un `mensaje` legible. `400` indica una entrada inválida, `404` un Pokémon o duelo inexistente, `409` un turno obsoleto o duelo finalizado y `422` un Pokémon no apto o un movimiento no disponible para ese participante. Un error de lectura del catálogo devuelve `500` con un mensaje de reintento. Las jugadas rechazadas dejan intacto el estado.

### Reglas

- **Turnos y salud.** Cada ronda comienza por el Pokémon más veloz. Se sortea el orden en caso de empate. Un fallo o una inmunidad consume el turno. Los PS iniciales y máximos proceden del catálogo. Al llegar un Pokémon a cero, se registra el ganador y se cierra el duelo.
- **Daño.** A nivel 50, la base es `(((2 × nivel / 5 + 2) × poder × ataque / defensa) / 50) + 2`. Se usan las estadísticas físicas o especiales según la categoría. La base se multiplica por el STAB de 1,5 si coincide el tipo, la efectividad de cada tipo defensor, una variación uniforme entre 0,85 y 1,00 y un factor de 1,5 si hay crítico. La probabilidad del crítico es del 6,25 %. El daño se trunca una vez al final y se limita a los PS restantes. Un acierto sin inmunidad causa al menos 1 PS.
- **Tipos.** La efectividad sigue la tabla de Pokémon Rojo, incluida la inmunidad de Psíquico frente a Fantasma. Dentro del duelo, Clefairy, Clefable, Jigglypuff y Wigglytuff son Normal, Magnemite y Magneton son Eléctrico y Mr. Mime es Psíquico. [Tabla de Pokémon Rojo](https://github.com/pret/pokered/blob/master/data/types/type_matchups.asm) · [Tipos históricos de PokéAPI](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_types_past.csv)
- **Movimientos.** Cada Pokémon recibe un ataque por tipo más Placaje y Pistola Agua, con duplicados eliminados. La asignación es una simplificación educativa. Se usa el poder y la precisión de Pokémon Rojo y se resuelve cada ataque como un solo golpe de daño directo. Furia Dragón se adapta a poder 40 para usar la fórmula común. [Datos de movimientos](https://github.com/pret/pokered/blob/master/data/moves/moves.asm)

### Pruebas y evidencias

Ejecuta `pnpm test` para verificar el CRUD, el motor y las rutas de combate. El informe incluye los resultados esperados y observados, las verificaciones de navegador y dos capturas del duelo de ejemplo. [Informe de pruebas](docs/combate/pruebas.md)

## Integrantes del grupo

- Jhon Alexander Trujillo
- Santiago Salazar
- Emmanuel Steven Gonzalez
