const nombresTipos = {
  Normal: 'Normal', Fire: 'Fuego', Water: 'Agua', Electric: 'Eléctrico', Grass: 'Planta',
  Ice: 'Hielo', Fighting: 'Lucha', Poison: 'Veneno', Ground: 'Tierra', Flying: 'Volador',
  Psychic: 'Psíquico', Bug: 'Bicho', Rock: 'Roca', Ghost: 'Fantasma', Dragon: 'Dragón'
};

const seleccion = document.querySelector('#seleccion');
const selectores = [document.querySelector('#pokemon-1'), document.querySelector('#pokemon-2')];
const iniciar = document.querySelector('#iniciar');
const carga = document.querySelector('#carga');
const aviso = document.querySelector('#aviso');
const error = document.querySelector('#error');
const reintentar = document.querySelector('#reintentar');
const duelo = document.querySelector('#combate');
const equipo = document.querySelector('#equipo');
const plantilla = document.querySelector('#tarjeta');
const ronda = document.querySelector('#ronda');
const estado = document.querySelector('#estado');
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
  for (const control of [...selectores, iniciar]) control.disabled = valor || !catalogoListo;
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
  const { jugador, nombre, foto, tipos, psMaximos, psActuales } = participante;
  const tarjeta = plantilla.content.firstElementChild.cloneNode(true);
  tarjeta.classList.toggle('activa', jugador === combate.jugadorActivo);
  tarjeta.querySelector('.jugador').textContent = `Jugador ${jugador}`;
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
  barra.value = psActuales;
  barra.setAttribute('aria-label', `PS de ${nombre}, jugador ${jugador}`);
  tarjeta.querySelector('.salud strong').textContent = `${psActuales} / ${psMaximos}`;
  return tarjeta;
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
  boton.addEventListener('click', () => ejecutarMovimiento(movimiento.id));
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

function mostrarCombate() {
  const { ganador, jugadorActivo, participantes, turno } = combate;
  const ganadorDatos = ganador === null ? null : participantes[ganador - 1];
  const activo = jugadorActivo === null ? null : participantes[jugadorActivo - 1];
  ronda.textContent = ganadorDatos ? 'Duelo finalizado' : `Ronda ${combate.ronda} / Turno ${turno}`;
  estado.textContent = ganadorDatos ?
    `Ganó ${ganadorDatos.nombre} · Jugador ${ganador}` : `Turno de ${activo.nombre} · Jugador ${jugadorActivo}`;
  indicacion.textContent = activo ? `Elige el ataque de ${activo.nombre}.` : 'Inicia un nuevo duelo para volver a jugar.';
  equipo.replaceChildren(...participantes.map(crearTarjeta));
  movimientos.replaceChildren(...(activo?.movimientos ?? []).map(crearMovimiento));
  historial.replaceChildren(...[...combate.historial].reverse().map(crearEvento));
  sinHistorial.hidden = combate.historial.length > 0;
  iniciar.textContent = 'Nuevo duelo';
  duelo.hidden = false;
}

seleccion.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (ocupado || !catalogoListo) return;
  const pokemonIds = selectores.map(({ value }) => Number(value));
  cambiarOcupado(true);
  indicarError();
  try {
    combate = await solicitar('/api/combates', { pokemonIds });
    mostrarCombate();
  } catch (fallo) {
    indicarError(fallo.message);
  } finally {
    cambiarOcupado(false);
  }
});

async function ejecutarMovimiento(movimientoId) {
  if (ocupado || combate?.estado !== 'en_curso') return;
  const { id, turno } = combate;
  cambiarOcupado(true);
  indicarError();
  try {
    combate = await solicitar(`/api/combates/${id}/acciones`, { movimientoId, turno });
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
cargarCatalogo();
