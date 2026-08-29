const bcrypt = require('bcrypt');
const pool = require('../src/db');

async function createUser() {
  const connection = await pool.getConnection();

  try {
    const usuario = 'admin';
    const password = 'admin123';
    const nombre = 'Administrador';

    // Obtenemos el rol admin
    const [roles] = await connection.query(
      'SELECT id_rol FROM roles WHERE nombre = ?',
      ['admin']
    );

    if (roles.length === 0) {
      throw new Error('No existe el rol admin');
    }

    const idRol = roles[0].id_rol;

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    await connection.beginTransaction();

    // Crear usuario
    const [resultUsuario] = await connection.query(
      `
      INSERT INTO usuarios (usuario, password_hash)
      VALUES (?, ?)
      `,
      [usuario, passwordHash]
    );

    // Crear persona
    await connection.query(
      `
      INSERT INTO personas (nombre, id_usuario, id_rol)
      VALUES (?, ?, ?)
      `,
      [nombre, resultUsuario.insertId, idRol]
    );

    await connection.commit();

    console.log('Usuario creado correctamente');
    console.log('Usuario:', usuario);
    console.log('Password:', password);
  } catch (error) {
    await connection.rollback();
    console.error('Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

createUser();