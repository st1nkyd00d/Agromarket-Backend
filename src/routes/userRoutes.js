const express = require('express')
const router = express.Router()
const upload = require('../middleware/multerMiddleware')
const { userSignUp, userLogin, updateUser, changePassword, getUser } = require('../controllers/userController')

//Obtener usuario por ID
router.get('/:id', getUser)

//Registrar usuario
router.post('/sign-up', userSignUp)

//Iniciar sesion
router.post('/login', userLogin)

//Actualizar usuario
router.put('/edit/:id', upload.single('profilePicture'), updateUser)

// Cambiar contraseña
router.post('/change-password/:id', changePassword)

module.exports = router
