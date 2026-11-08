const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const codigoOriginal = path.resolve(__dirname, '../../src');
const catalogoOriginal = path.join(codigoOriginal, 'data', 'pokemons.json');

function hashCatalogo() {
  return createHash('sha256').update(fs.readFileSync(catalogoOriginal)).digest('hex');
}

function crearAppTemporal() {
  const hashOriginal = hashCatalogo();
  const directorio = fs.mkdtempSync(path.join(__dirname, '.app-'));
  const codigo = path.join(directorio, 'src');
  const limpiar = () => fs.rmSync(directorio, { recursive: true, force: true });

  try {
    fs.cpSync(codigoOriginal, codigo, { recursive: true });
    return {
      app: require(path.join(codigo, 'app.js')),
      catalogo: path.join(codigo, 'data', 'pokemons.json'),
      cerrar() {
        limpiar();
        expect(hashCatalogo()).toBe(hashOriginal);
      }
    };
  } catch (error) {
    limpiar();
    throw error;
  }
}

module.exports = { crearAppTemporal };
