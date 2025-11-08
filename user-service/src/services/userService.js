// backend/user-service/src/services/userService.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { 
  findUserByEmail, 
  createUser, 
  updateLastLogin 
} from '../models/userModel.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 12;

// 🧱 Generar token JWT
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.user_id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// 🧼 Limpiar datos sensibles
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

// 🧩 Registrar usuario
export const registerUser = async (email, password, name, dateOfBirth, country) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) throw new Error('El correo ya está registrado.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = await createUser(email, passwordHash, name, dateOfBirth, country);

  const token = generateToken(newUser);
  return {
    message: 'Usuario registrado exitosamente.',
    user: sanitizeUser(newUser),
    token
  };
};

// 🔐 Iniciar sesión
export const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('Credenciales inválidas.');

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) throw new Error('Credenciales inválidas.');

  await updateLastLogin(user.user_id);

  const token = generateToken(user);
  return {
    message: 'Inicio de sesión exitoso.',
    user: sanitizeUser(user),
    token
  };
};
