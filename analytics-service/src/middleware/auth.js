// analytics-service/src/middleware/auth.js
// Mejorado para microservicios: admite validación con HS256 (secreto compartido)
// o RS256 usando JWKS (recomendado para producción y validación en API Gateway).

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Config por env
const JWT_SECRET = process.env.JWT_SECRET || null; // HS256 secret (fallback desactivado para seguridad)
const JWKS_URI = process.env.JWKS_URI || null;     // Si se provee, se usa RS256+JWKS
const JWT_ISSUER = process.env.JWT_ISSUER || null; // Opcional: validar issuer
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || null; // Opcional: validar audience

// Cliente JWKS (si se configura)
let jwks = null;
if (JWKS_URI) {
  jwks = jwksClient({
    jwksUri: JWKS_URI,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });
}

// Helper: obtener clave pública a partir del kid
const getPublicKey = (header) => {
  return new Promise((resolve, reject) => {
    if (!jwks) return reject(new Error('JWKS not configured'));
    if (!header || !header.kid) return reject(new Error('Token header missing kid'));

    jwks.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      const pubKey = key.getPublicKey ? key.getPublicKey() : key.rsaPublicKey;
      resolve(pubKey);
    });
  });
};

// Opciones de verificación comunes
const buildVerifyOptions = () => {
  const opts = { algorithms: [] };
  if (JWKS_URI) {
    // RS* algorithms
    opts.algorithms = ['RS256', 'RS384', 'RS512'];
  } else if (JWT_SECRET) {
    opts.algorithms = ['HS256'];
  }

  if (JWT_ISSUER) opts.issuer = JWT_ISSUER;
  if (JWT_AUDIENCE) opts.audience = JWT_AUDIENCE;
  return opts;
};

// Verifica el token (soporta JWKS o secret)
const verifyToken = async (token) => {
  const verifyOptions = buildVerifyOptions();

  // Si usamos JWKS (RS256)
  if (jwks) {
    // Decodificar header para obtener kid
    const decodedHeader = jwt.decode(token, { complete: true })?.header;
    if (!decodedHeader) throw new Error('Invalid token format');

    const publicKey = await getPublicKey(decodedHeader);
    return jwt.verify(token, publicKey, verifyOptions);
  }

  // Si usamos secret (HS256)
  if (JWT_SECRET) {
    return jwt.verify(token, JWT_SECRET, verifyOptions);
  }

  // Ningún método configurado
  throw new Error('No JWT verification method configured (set JWKS_URI or JWT_SECRET)');
};

// Middleware: forzar autenticación (requerido)
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    try {
      const decoded = await verifyToken(token);

      // Mapear claims esperados a req.user (normalizar)
      req.user = {
        userId: decoded.userId ?? decoded.sub ?? decoded.uid,
        email: decoded.email,
        roles: decoded.roles || decoded.role || [],
        raw: decoded,
      };

      return next();
    } catch (verErr) {
      console.error('Token verification error:', verErr.message);
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Middleware opcional: intenta autenticar, pero deja pasar si no hay token
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return next();

    try {
      const decoded = await verifyToken(token);
      req.user = {
        userId: decoded.userId ?? decoded.sub ?? decoded.uid,
        email: decoded.email,
        roles: decoded.roles || decoded.role || [],
        raw: decoded,
      };
    } catch (err) {
      // Si token inválido, NO bloquear en optionalAuth: solo no setear req.user
      console.warn('Optional auth: invalid token (ignored):', err.message);
    }

    return next();
  } catch (error) {
    console.error('Optional auth error:', error);
    return next();
  }
};

// Middleware: validar userId en params (verifica que coincida con req.user.userId)
export const validateUserParam = (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  if (String(req.user.userId) !== String(userId)) {
    console.warn(`Access denied: User ${req.user.userId} tried to access data for user ${userId}`);
    return res.status(403).json({ success: false, error: 'Access denied to other user data' });
  }

  return next();
};

// Middleware: require admin (usa claim roles o isAdmin en token)
export const requireAdmin = (opts = {}) => {
  // opts: { claimPath: 'roles', check: (roles)=>boolean }
  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Authentication required' });

      const roles = req.user.roles || (req.user.raw && req.user.raw.roles) || [];
      const isAdminClaim = req.user.raw && (req.user.raw.isAdmin || req.user.raw.admin);

      const isAdmin = Array.isArray(roles) ? roles.includes('admin') : !!isAdminClaim;

      if (!isAdmin) return res.status(403).json({ success: false, error: 'Admin access required' });

      return next();
    } catch (error) {
      console.error('Admin check error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
};

// Export adicional: helper para tests/otros servicios
export const _verifyToken = verifyToken;
