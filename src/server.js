const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Verificar que la API está viva
app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      api: 'online',
      database: 'connected'
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      api: 'online',
      database: 'error'
    });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;

    // Validar datos
    if (!usuario || !password) {
      return res.status(400).json({
        access: false
      });
    }

    // Buscar usuario
    const [usuarios] = await pool.query(
      `
      SELECT
        id_usuario,
        usuario,
        password_hash,
        activo
      FROM usuarios
      WHERE usuario = ?
      LIMIT 1
      `,
      [usuario]
    );

    // Usuario no existe
    if (usuarios.length === 0) {
      return res.status(401).json({
        access: false
      });
    }

    const user = usuarios[0];

    // Usuario desactivado
    if (!user.activo) {
      return res.status(401).json({
        access: false
      });
    }

    // Comparar contraseña
    const passwordCorrecto = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordCorrecto) {
      return res.status(401).json({
        access: false
      });
    }

    // Login correcto
    return res.json({
      access: true
    });

  } catch (error) {
    console.error('Error en login:', error);

    return res.status(500).json({
      access: false
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});