const express = require('express')
const router = express.Router()
const upload = require('../middleware/multerMiddleware')
const {
  getAllProducts,
  getOneProduct,
  createProduct,
  getProductsByUser,
  updateProduct,
  deleteProduct,
  getSellerByProductId,
  getProductCountByUser
} = require('../controllers/productController')

// Ruta para obtener todos los productos
router.get('/all', getAllProducts)

router.get('/by-product/:id', getOneProduct)

// Ruta para crear un nuevo producto
router.post('/create', upload.single('productImage'), createProduct)

// Nueva ruta para obtener productos por usuario
router.get('/by-user/:userId', getProductsByUser)

// Rutas para actualizar y eliminar un producto
router.put('/edit/:productId', upload.single('productImage'), updateProduct)

// Ruta para eliminar un producto
router.delete('/delete/:productId', deleteProduct)

// Ruta para obtener al vendedor de un producto
router.get('/:productId/seller', getSellerByProductId)

// Ruta para obtener la cantidad de productos por usuario
router.get('/count/:userId', getProductCountByUser)

module.exports = router
