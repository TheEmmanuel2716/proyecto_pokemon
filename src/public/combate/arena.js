const nombresTipos = {
  Normal: 'Normal', Fire: 'Fuego', Water: 'Agua', Electric: 'Eléctrico', Grass: 'Planta',
  Ice: 'Hielo', Fighting: 'Lucha', Poison: 'Veneno', Ground: 'Tierra', Flying: 'Volador',
  Psychic: 'Psíquico', Bug: 'Bicho', Rock: 'Roca', Ghost: 'Fantasma', Dragon: 'Dragón'
};

const seleccion = document.querySelector('#seleccion');
const selectores = [document.querySelector('#pokemon-1'), document.querySelector('#pokemon-2')];
const iniciar = document.querySelector('#iniciar');
const opcionesDuelo = document.querySelector('#opciones-duelo');
const repetirDuelo = document.querySelector('#repetir-duelo');
const nuevoDuelo = document.querySelector('#nuevo-duelo');
const camposNombres = [document.querySelector('#nombre-jugador-1'), document.querySelector('#nombre-jugador-2')];
const etiquetasJugadores = [document.querySelector('#etiqueta-jugador-1'), document.querySelector('#etiqueta-jugador-2')];
const carga = document.querySelector('#carga');
const aviso = document.querySelector('#aviso');
const error = document.querySelector('#error');
const reintentar = document.querySelector('#reintentar');
const duelo = document.querySelector('#combate');
const equipo = document.querySelector('#equipo');
const efectos = document.querySelector('#efectos-arena');
const plantilla = document.querySelector('#tarjeta');
const ronda = document.querySelector('#ronda');
const estado = document.querySelector('#estado');
const resultadoDuelo = document.querySelector('#resultado-duelo');
const nombreGanador = document.querySelector('#nombre-ganador');
const pokemonGanador = document.querySelector('#pokemon-ganador');
const indicacion = document.querySelector('#indicacion-movimientos');
const movimientos = document.querySelector('#movimientos');
const historial = document.querySelector('#historial');
const sinHistorial = document.querySelector('#sin-historial');

let catalogoListo = false;
let ocupado = false;
let combate;

async function solicitar(url, datos) {
  let respuesta;
  try {
    respuesta = await fetch(url, datos === undefined ? undefined : {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
  } catch {
    throw new Error('No se pudo conectar con la API. Intenta de nuevo.');
  }

  const contenido = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || contenido.data === undefined) {
    const fallo = new Error(contenido.mensaje ?? 'La API no pudo responder a la solicitud.');
    fallo.status = respuesta.status;
    throw fallo;
  }
  return contenido.data;
}

function indicarError(mensaje = '', cargarDeNuevo = false) {
  aviso.hidden = !mensaje;
  error.textContent = mensaje;
  reintentar.hidden = !cargarDeNuevo;
}

function cambiarOcupado(valor) {
  ocupado = valor;
  const hayCombate = Boolean(combate);
  for (const control of [...selectores, iniciar]) control.disabled = valor || !catalogoListo || hayCombate;
  for (const campo of camposNombres) campo.disabled = valor;
  repetirDuelo.disabled = valor;
  nuevoDuelo.disabled = valor;
  iniciar.hidden = hayCombate;
  opcionesDuelo.hidden = !hayCombate;
  duelo.hidden = !hayCombate;
  for (const boton of movimientos.querySelectorAll('button')) boton.disabled = valor;
  movimientos.setAttribute('aria-busy', String(valor));
}

async function cargarCatalogo() {
  cambiarOcupado(true);
  indicarError();
  carga.hidden = false;
  try {
    const catalogo = await solicitar('/api/pokemons');
    if (!Array.isArray(catalogo) || !catalogo.length) throw new Error('El catálogo está vacío.');
    for (const selector of selectores) {
      selector.replaceChildren(
        new Option('Selecciona un Pokémon', ''),
        ...catalogo.map(({ id, nombre }) => new Option(`#${String(id).padStart(3, '0')} · ${nombre}`, id))
      );
    }
    catalogoListo = true;
  } catch (fallo) {
    indicarError(fallo.message, true);
  } finally {
    carga.hidden = true;
    cambiarOcupado(false);
  }
}

function crearTarjeta(participante) {
  const { jugador, nombre, foto, tipos, psMaximos } = participante;
  const tarjeta = plantilla.content.firstElementChild.cloneNode(true);
  tarjeta.querySelector('.nombre').textContent = nombre;

  const insignias = tarjeta.querySelector('.tipos');
  for (const tipo of tipos) {
    const insignia = document.createElement('span');
    insignia.className = 'tipo';
    insignia.textContent = nombresTipos[tipo];
    insignias.append(insignia);
  }

  if (foto) {
    const imagen = tarjeta.querySelector('img');
    const alternativa = tarjeta.querySelector('.sin-imagen');
    imagen.addEventListener('load', () => {
      imagen.hidden = false;
      alternativa.hidden = true;
    }, { once: true });
    imagen.alt = nombre;
    imagen.src = foto;
  }

  const barra = tarjeta.querySelector('progress');
  barra.max = psMaximos;
  barra.setAttribute('aria-label', `PS de ${nombre}, jugador ${jugador}`);
  return tarjeta;
}

function mostrarSalud(tarjeta, psActuales) {
  const barra = tarjeta.querySelector('progress');
  barra.value = psActuales;
  tarjeta.querySelector('.salud strong').textContent = `${psActuales} / ${barra.max}`;
}

function crearEfecto(clase, { x, y }) {
  const elemento = document.createElement('span');
  elemento.className = clase;
  elemento.style.left = `${x}px`;
  elemento.style.top = `${y}px`;
  efectos.append(elemento);
  return elemento;
}

async function animarLanzamiento(atacante, origen, destino, movimiento, fallo) {
  const fisico = movimiento.categoria === 'fisico';
  const distanciaX = destino.x - origen.x;
  const distanciaY = destino.y - origen.y - (fallo ? 42 : 0);
  const avance = distanciaX * (fisico ? 0.42 : 0.09);
  const proyectil = crearEfecto(fisico ? 'proyectil fisico' : 'proyectil', origen);
  proyectil.classList.toggle('hacia-izquierda', distanciaX < 0);
  const duracion = fisico ? 300 : 380;

  await Promise.all([
    atacante.animate([
      { transform: 'translateX(0)' },
      { transform: `translateX(${-Math.sign(distanciaX) * 7}px)`, offset: 0.18 },
      { transform: `translateX(${avance}px)`, offset: 0.62 },
      { transform: 'translateX(0)' }
    ], { duration: duracion, easing: 'ease-in-out' }).finished,
    proyectil.animate([
      { transform: 'translate(-50%, -50%) scale(.55)', opacity: 0.2 },
      { opacity: 1, offset: 0.25 },
      { transform: `translate(calc(${distanciaX}px - 50%), calc(${distanciaY}px - 50%))`, opacity: 1 }
    ], { duration: duracion, easing: 'cubic-bezier(.4, 0, .7, 1)', fill: 'forwards' }).finished
  ]);
  proyectil.remove();
}

async function animarImpacto(tarjeta, defensor, destino, evento, direccion) {
  const { resultado, danio, critico, psRestantes } = evento;
  const rotulo = crearEfecto('rotulo-impacto', destino);
  rotulo.textContent = resultado === 'fallo' ? 'Falló' : resultado === 'inmune' ? 'Inmune' :
    `${critico ? '¡Crítico! ' : ''}−${danio} PS`;
  const animaciones = [
    rotulo.animate([
      { transform: 'translate(-50%, -45%)', opacity: 0 },
      { opacity: 1, offset: 0.18 },
      { opacity: 1, offset: 0.75 },
      { transform: 'translate(-50%, -220%)', opacity: 0 }
    ], { duration: 480, easing: 'ease-out' }).finished
  ];

  if (resultado !== 'fallo') {
    const onda = crearEfecto('onda-impacto', destino);
    onda.dataset.resultado = resultado;
    animaciones.push(onda.animate([
      { transform: 'translate(-50%, -50%) scale(.35)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(2.1)', opacity: 0 }
    ], { duration: 340, easing: 'ease-out' }).finished);
  }

  if (resultado === 'acierto') {
    mostrarSalud(tarjeta, psRestantes);
    animaciones.push(defensor.animate([
      { transform: 'translateX(0)', filter: 'brightness(1)' },
      { transform: `translateX(${direccion * 14}px)`, filter: 'brightness(1.55)', offset: 0.25 },
      { transform: `translateX(${direccion * -4}px)`, filter: 'brightness(1)', offset: 0.6 },
      { transform: 'translateX(0)', filter: 'brightness(1)' }
    ], { duration: 330, easing: 'ease-out' }).finished);
  } else if (resultado === 'fallo') {
    animaciones.push(defensor.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(12px)', offset: 0.3 },
      { transform: 'translateY(0)' }
    ], { duration: 280, easing: 'ease-in-out' }).finished);
  }

  await Promise.all(animaciones);
  if (psRestantes === 0) {
    await defensor.animate([
      { transform: 'translateY(0) scale(1)', opacity: 1 },
      { transform: 'translateY(26px) scale(.82)', opacity: 0 }
    ], { duration: 320, easing: 'ease-in', fill: 'forwards' }).finished;
    defensor.hidden = true;
  }
}

async function animarAccion(evento, movimiento) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate) return;
  const atacante = equipo.children[evento.jugador - 1].querySelector('.figura');
  const tarjetaObjetivo = equipo.children[evento.objetivo - 1];
  const defensor = tarjetaObjetivo.querySelector('.figura');
  const campo = efectos.getBoundingClientRect();
  const centro = (figura) => {
    const { left, top, width, height } = figura.getBoundingClientRect();
    return { x: left - campo.left + width / 2, y: top - campo.top + height / 2 };
  };
  const origen = centro(atacante);
  const destino = centro(defensor);
  efectos.dataset.tipo = movimiento.tipo;
  estado.textContent = `${combate.participantes[evento.jugador - 1].nombre} usó ${evento.movimiento}.`;
  try {
    await animarLanzamiento(atacante, origen, destino, movimiento, evento.resultado === 'fallo');
    await animarImpacto(tarjetaObjetivo, defensor, destino, evento, Math.sign(destino.x - origen.x));
  } finally {
    efectos.replaceChildren();
  }
}

function crearMovimiento(movimiento) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'movimiento';
  boton.textContent = movimiento.nombre;
  const detalle = document.createElement('small');
  detalle.textContent = `${nombresTipos[movimiento.tipo]} · ${movimiento.precision}%`;
  boton.append(detalle);
  boton.disabled = ocupado;
  boton.addEventListener('click', () => ejecutarMovimiento(movimiento));
  return boton;
}

function crearEvento(evento) {
  const { jugador, objetivo, movimiento, resultado, danio, psRestantes, critico, efectividad, stab, turno } = evento;
  const atacante = combate.participantes[jugador - 1].nombre;
  const defensor = combate.participantes[objetivo - 1].nombre;
  let texto = `${atacante} usó ${movimiento}.`;
  if (resultado === 'fallo') texto += ' El ataque falló.';
  else if (resultado === 'inmune') texto += ` ${defensor} es inmune.`;
  else {
    texto += ` Quitó ${danio} PS a ${defensor} (${psRestantes} restantes).`;
    if (efectividad > 1) texto += ' ¡Súper eficaz!';
    if (efectividad < 1) texto += ' Poco eficaz.';
    if (critico) texto += ' ¡Golpe crítico!';
    if (stab > 1) texto += ' STAB.';
  }
  const fila = document.createElement('li');
  const numero = document.createElement('span');
  numero.className = 'etiqueta';
  numero.textContent = `T${String(turno).padStart(2, '0')}`;
  fila.append(numero, texto);
  return fila;
}

function mostrarNombres() {
  const nombres = camposNombres.map(({ value }, posicion) => value.trim() || `Jugador ${posicion + 1}`);
  for (const [posicion, nombre] of nombres.entries()) {
    etiquetasJugadores[posicion].textContent = `0${posicion + 1} / ${nombre}`;
    if (combate) equipo.children[posicion].querySelector('.jugador').textContent = nombre;
  }
  if (!combate) return;

  const { ganador, jugadorActivo, participantes } = combate;
  const posicion = (ganador ?? jugadorActivo) - 1;
  const pokemon = participantes[posicion].nombre;
  const nombre = nombres[posicion];
  estado.textContent = ganador === null ? `Turno de ${pokemon} · ${nombre}` : `Ganó ${pokemon} · ${nombre}`;
  resultadoDuelo.hidden = ganador === null;
  if (ganador !== null) {
    resultadoDuelo.dataset.jugador = ganador;
    nombreGanador.textContent = `Ganó ${nombre}`;
    pokemonGanador.textContent = pokemon;
  }
}

function mostrarCombate(nuevo = false) {
  const { ganador, jugadorActivo, participantes, turno } = combate;
  const activo = jugadorActivo === null ? null : participantes[jugadorActivo - 1];
  ronda.textContent = ganador === null ? `Ronda ${combate.ronda} / Turno ${turno}` : 'Duelo finalizado';
  indicacion.textContent = activo ? `Elige el ataque de ${activo.nombre}.` : 'Repite el duelo o elige otros Pokémon.';
  if (nuevo) equipo.replaceChildren(...participantes.map(crearTarjeta));
  for (const [posicion, participante] of participantes.entries()) {
    const tarjeta = equipo.children[posicion];
    const debilitado = participante.psActuales === 0;
    tarjeta.classList.toggle('activa', participante.jugador === jugadorActivo);
    tarjeta.querySelector('.figura').hidden = debilitado;
    tarjeta.querySelector('.debilitado').hidden = !debilitado;
    mostrarSalud(tarjeta, participante.psActuales);
  }
  mostrarNombres();
  movimientos.replaceChildren(...(activo?.movimientos ?? []).map(crearMovimiento));
  historial.replaceChildren(...[...combate.historial].reverse().map(crearEvento));
  sinHistorial.hidden = combate.historial.length > 0;
}

async function iniciarCombate(pokemonIds) {
  cambiarOcupado(true);
  indicarError();
  try {
    combate = await solicitar('/api/combates', { pokemonIds });
    mostrarCombate(true);
  } catch (fallo) {
    indicarError(fallo.message);
  } finally {
    cambiarOcupado(false);
  }
}

seleccion.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (ocupado || !catalogoListo || combate) return;
  iniciarCombate(selectores.map(({ value }) => Number(value)));
});

repetirDuelo.addEventListener('click', () => {
  if (ocupado || !combate) return;
  iniciarCombate(combate.participantes.map(({ pokemonId }) => pokemonId));
});

nuevoDuelo.addEventListener('click', () => {
  if (ocupado || !combate) return;
  combate = undefined;
  seleccion.reset();
  indicarError();
  cambiarOcupado(false);
  selectores[0].focus();
});

async function ejecutarMovimiento(movimiento) {
  if (ocupado || combate?.estado !== 'en_curso') return;
  const { id, turno } = combate;
  cambiarOcupado(true);
  indicarError();
  try {
    const actualizado = await solicitar(`/api/combates/${id}/acciones`, { movimientoId: movimiento.id, turno });
    await animarAccion(actualizado.historial.at(-1), movimiento).catch((fallo) => {
      console.warn('No se pudo animar la jugada.', fallo);
    });
    combate = actualizado;
    mostrarCombate();
  } catch (fallo) {
    indicarError(fallo.message);
    if (fallo.status === 409) {
      try {
        combate = await solicitar(`/api/combates/${id}`);
        mostrarCombate();
      } catch (consultaFallida) {
        indicarError(consultaFallida.message);
      }
    }
  } finally {
    cambiarOcupado(false);
  }
}

reintentar.addEventListener('click', cargarCatalogo);
for (const campo of camposNombres) campo.addEventListener('input', mostrarNombres);
cargarCatalogo();
