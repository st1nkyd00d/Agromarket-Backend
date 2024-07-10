const express = require('express')
const router = express.Router()
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoriteController')

// Ruta para obtener los favoritos de un usuario
router.get('/all/:userId', getFavorites)

// Ruta para añadir un producto a favoritos
router.post('/add', addFavorite)

// Ruta para eliminar un producto de favoritos
router.post('/remove', removeFavorite)

module.exports = router
