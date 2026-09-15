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
pokemon-api/
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
cd pokemon-api

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

## Integrantes del grupo

- Jhon Alexander Trujillo
- Santiago Salazar
- Emmanuel Steven Gonzalez
