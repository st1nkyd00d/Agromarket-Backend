const express = require('express')
const router = express.Router()
const { getCart, addToCart, updateCartItemQuantity, removeFromCart, checkoutCart } = require('../controllers/cartController')

// Ruta para obtener el carrito del usuario
router.get('/:userId', getCart)

// Ruta para agregar un producto al carrito
router.post('/add', addToCart)

// Ruta para eliminar un producto del carrito
router.post('/remove', removeFromCart)

// Ruta para actualizar la cantidad de un producto en el carrito
router.patch('/update', updateCartItemQuantity)

// Ruta para realizar el checkout del carrito
router.post('/checkout/:userId', checkoutCart)

module.exports = router
