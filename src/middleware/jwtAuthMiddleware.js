const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No existe un token de autenticación' })
  }

  jwt.verify(token, process.env.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'El token no es válido. Por lo tanto, no tienes permiso para acceder a esta ruta' })
    }
    req.user = user
    next()
  })
}

module.exports = authenticateToken
