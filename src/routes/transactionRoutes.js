const express = require('express')
const router = express.Router()
const {
  getTransactions,
  getTransactionsAsBuyer,
  getTransactionsAsSeller,
  createTransaction,
  confirmTransaction,
  rejectTransaction,
  getPendingPurchases
} = require('../controllers/transactionController')

// Ruta para obtener todas las transacciones
router.get('/all', getTransactions)

// Ruta para obtener las compras por usuario
router.get('/purchase/:userId', getTransactionsAsBuyer)

// Ruta para obtener las ventas por usuario
router.get('/sell/:userId', getTransactionsAsSeller)

// Ruta para crear una nueva transacción
router.post('/generate', createTransaction)

// Ruta para confirmar una transacción
router.post('/confirm/:transactionId', confirmTransaction)

// Ruta para rechazar una transacción
router.post('/reject/:transactionId', rejectTransaction)

// Ruta para obtener las transacciones pendientes de compra por usuario
router.get('/pending-purchases/:userId', getPendingPurchases)

module.exports = router
