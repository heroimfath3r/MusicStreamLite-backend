// analytics-service/src/middleware/auth.js
// Middleware unificado con JWT (consistente con user-service)
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Middleware para verificar tokens JWT
export const authenticateToken = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access token required' 
      });
    }

    // Verificar token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err.message);
        return res.status(403).json({ 
          success: false,
          error: 'Invalid or expired token' 
        });
      }

      // Agregar información del usuario al request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        uid: decoded.userId // Mantener compatibilidad con código existente que use 'uid'
      };

      next();
    });

  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

// Middleware para verificar si es admin (opcional)
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required' 
      });
    }
    
    // TODO: Aquí iría la lógica para verificar roles de admin
    // Por ejemplo: verificar en Firestore si el usuario tiene rol admin
    // const userDoc = await db.collection('users').doc(req.user.userId).get();
    // if (!userDoc.data()?.isAdmin) { return res.status(403)... }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(403).json({ 
      success: false,
      error: 'Admin access required' 
    });
  }
};

// Middleware para verificar user ID en parámetros
export const validateUserParam = (req, res, next) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false,
      error: 'User ID is required' 
    });
  }
  
  // Si el usuario está autenticado, verificar que coincide con el parámetro
  // Convertir ambos a string para comparación segura
  if (req.user && String(req.user.userId) !== String(userId)) {
    console.warn(`Access denied: User ${req.user.userId} tried to access data for user ${userId}`);
    return res.status(403).json({ 
      success: false,
      error: 'Access denied to other user data'
    });
  }
  
  next();
};

// Middleware opcional de autenticación (permite acceso con o sin token)
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err) {
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            uid: decoded.userId
          };
        }
      });
    }
    
    // Continúa siempre, con o sin usuario autenticado
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};