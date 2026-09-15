const ESTADISTICAS_REQUERIDAS = [
  'ps',
  'ataque',
  'defensa',
  'ataqueEspecial',
  'defensaEspecial',
  'velocidad'
];

/**
 * Valida el body para la creacion de un Pokemon (POST).
 * Requiere: nombre, foto y las 6 estadisticas principales.
 */
function validarCreacion(req, res, next) {
  const errores = [];
  const { nombre, foto, estadisticas } = req.body;

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    errores.push('El campo "nombre" es obligatorio y debe ser un texto.');
  }

  if (!foto || typeof foto !== 'string' || foto.trim() === '') {
    errores.push('El campo "foto" es obligatorio y debe ser una URL en texto.');
  }

  if (!estadisticas || typeof estadisticas !== 'object') {
    errores.push('El campo "estadisticas" es obligatorio y debe ser un objeto.');
  } else {
    ESTADISTICAS_REQUERIDAS.forEach((stat) => {
      const valor = estadisticas[stat];
      if (valor === undefined || valor === null) {
        errores.push(`La estadistica "${stat}" es obligatoria.`);
      } else if (typeof valor !== 'number' || Number.isNaN(valor) || valor < 0) {
        errores.push(`La estadistica "${stat}" debe ser un numero mayor o igual a 0.`);
      }
    });
  }

  if (errores.length > 0) {
    return res.status(400).json({ mensaje: 'Datos invalidos', errores });
  }

  next();
}

/**
 * Valida el body para la actualizacion de un Pokemon (PUT/PATCH).
 * Los campos son opcionales, pero si vienen deben ser validos.
 */
function validarActualizacion(req, res, next) {
  const errores = [];
  const { nombre, foto, estadisticas } = req.body;

  if (Object.keys(req.body).length === 0) {
    return res
      .status(400)
      .json({ mensaje: 'Debe enviar al menos un campo para actualizar.' });
  }

  if (nombre !== undefined && (typeof nombre !== 'string' || nombre.trim() === '')) {
    errores.push('El campo "nombre" debe ser un texto no vacio.');
  }

  if (foto !== undefined && (typeof foto !== 'string' || foto.trim() === '')) {
    errores.push('El campo "foto" debe ser una URL en texto.');
  }

  if (estadisticas !== undefined) {
    if (typeof estadisticas !== 'object') {
      errores.push('El campo "estadisticas" debe ser un objeto.');
    } else {
      Object.entries(estadisticas).forEach(([stat, valor]) => {
        if (!ESTADISTICAS_REQUERIDAS.includes(stat)) {
          errores.push(`La estadistica "${stat}" no es valida.`);
        } else if (typeof valor !== 'number' || Number.isNaN(valor) || valor < 0) {
          errores.push(`La estadistica "${stat}" debe ser un numero mayor o igual a 0.`);
        }
      });
    }
  }

  if (errores.length > 0) {
    return res.status(400).json({ mensaje: 'Datos invalidos', errores });
  }

  next();
}

module.exports = { validarCreacion, validarActualizacion };
