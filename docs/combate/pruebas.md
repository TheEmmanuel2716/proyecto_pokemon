# Informe de pruebas del módulo de combate Pokémon

La verificación automatizada obtuvo **37 pruebas aprobadas de 37** con `pnpm test`. Las suites de integración arrancan la aplicación con un catálogo temporal y comprueban que el catálogo original conserve su hash. El motor se prueba con valores de azar controlados.

## Casos funcionales obligatorios

| Caso | Resultado esperado | Resultado obtenido |
| --- | --- | --- |
| Seleccionar dos Pokémon | Crear un duelo con los dos IDs del catálogo. | La API devolvió `201` con Charmander y Squirtle. Los selectores de la arena cargaron los 151 registros. |
| Mostrar datos básicos | Ver nombres, imágenes si existen, tipos y PS máximos y actuales. | La arena mostró Fuego y Agua, y PS iniciales de 39/39 y 44/44. |
| Ejecutar un movimiento | Reducir los PS del defensor y ceder el turno. | Ascuas quitó 12 PS en la prueba controlada y dejó a Squirtle en 32/44, con el turno activo. |
| Fallar por precisión | Registrar el fallo, conservar los PS y consumir el turno. | Placaje falló con una tirada de 95 sobre precisión 95. El objetivo conservó 100 PS. |
| Aplicar STAB | Multiplicar por 1,5 cuando coinciden los tipos. | En el escenario neutral del motor, el mismo movimiento causó 51 PS con STAB y 34 sin él. |
| Atacar una debilidad | Aplicar un factor de 2 al atacar Fuego con Agua. | Pistola Agua registró efectividad 2 y quitó los 39 PS restantes de Charmander. |
| Atacar una resistencia | Aplicar un factor de 0,5 al atacar Agua con Fuego. | Ascuas registró efectividad 0,5 y la arena mostró «Poco eficaz». |
| Encontrar una inmunidad | Un ataque Fantasma causa cero daño a un objetivo Psíquico en primera generación. | El motor devolvió daño 0 contra un objetivo Psíquico/Fantasma pese al STAB y a la debilidad del segundo tipo. |
| Limitar los PS | El exceso de daño deja al defensor exactamente en cero. | Un defensor con 4 PS quedó en 0 y el historial registró 4 PS de daño aplicado. |
| Determinar el ganador | Finalizar el duelo al llegar a cero PS y mostrar al ganador. | La API devolvió el ganador y un turno activo nulo. La arena mostró «Ganó Squirtle · Jugador 2». |
| Rechazar acciones posteriores | Devolver `409` y conservar el estado final. | Se recibió `409` y la siguiente consulta devolvió el mismo estado. La arena retiró los botones de ataque. |
| Manejar errores y registros incompletos | Mostrar un mensaje y permitir recuperarse de un fallo de consulta. | Un registro sin tipo o con defensa cero devolvió `422`. Un catálogo ilegible devolvió `500` con un mensaje de reintento. En el navegador se simuló un error temporal y el botón **Reintentar** recuperó el catálogo. |

## Comprobaciones adicionales

- El motor verificó la prioridad por Velocidad, el sorteo en empate y al inicio de una nueva ronda, el uso de estadísticas físicas y especiales, la efectividad de tipos dobles, el umbral de crítico y el daño mínimo.
- La API verificó los siete tipos históricos, los IDs inválidos, el JSON mal formado, una foto ausente y la conservación de los datos con los que empezó un duelo. Dos envíos simultáneos del mismo turno produjeron un `200`, un `409` y una sola entrada de historial.
- En Chrome se verificó el bloqueo de controles durante una petición demorada. En una vista de 390 px se comprobó el texto «Sin imagen» con una foto ausente y que el contenido no produjera desplazamiento horizontal.

## Capturas del duelo

Charmander ejecutó Ascuas y Squirtle quedó con 32 de 44 PS. [Ver duelo en curso](evidencias/01-duelo-en-curso.png)

Squirtle respondió con Pistola Agua, dejó a Charmander en 0 PS y ganó el duelo. [Ver duelo finalizado](evidencias/02-duelo-finalizado.png)
