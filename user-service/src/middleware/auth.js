// middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

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
        email: decoded.email
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