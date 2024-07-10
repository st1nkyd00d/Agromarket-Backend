const User = require('../models/userSchema')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const cloudinary = require('../utils/cloudinary')

const getUser = async (req, res) => {
  try {
    const userId = req.params.id
    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.status(200).json(user)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar recuperar los datos del usuario.' })
  }
}

const userSignUp = async (req, res) => {
  try {
    let { name, lastName, nationalId, phoneNumber, emailAddress, password, description, profilePicture } = req.body

    emailAddress = emailAddress.toLowerCase()

    if (!name || !lastName || !nationalId || !phoneNumber || !emailAddress || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    const phoneRegex = /^\+58\d{10}$/
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: 'El nro de teléfono debe tener el formato +58 424123456 (Ejemplo)' })
    }

    const passwordRegex = /^(?=.*[0-9])/
    if (password.length < 6 || !passwordRegex.test(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres y contener un número' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      lastName,
      nationalId,
      phoneNumber,
      emailAddress,
      password: hashedPassword,
      description,
      profilePicture: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    })

    const token = jwt.sign({ userId: user._id }, process.env.secret, { expiresIn: '7d' })

    res.status(201).json({ message: '¡Te has registrado exitosamente', token })
  } catch (error) {
    console.log(error)

    if (error.code === 11000) {
      if (error.keyPattern.emailAddress) {
        return res.status(400).json({ error: 'Ese correo ya está registrado' })
      } else if (error.keyPattern.phoneNumber) {
        return res.status(400).json({ error: 'Ese número de teléfono ya está registrado' })
      } else if (error.keyPattern.nationalId) {
        return res.status(400).json({ error: 'Esa cédula de identidad ya está registrada' })
      }
    }

    res.status(500).json({ error: 'Ocurrió un error al intentar registrarte' })
  }
}

const userLogin = async (req, res) => {
  try {
    let { emailAddress, password } = req.body

    emailAddress = emailAddress.toLowerCase()
    console.log(req.body)
    if (!emailAddress || !password) {
      return res.status(400).json({ error: 'El usuario y la contraseña son requeridos para iniciar sesión' })
    }

    const user = await User.findOne({ emailAddress })
    if (!user) {
      return res.status(404).json({ error: 'No existe una cuenta con ese correo' })
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'La contraseña es incorrecta' })
    }
    const token = jwt.sign({ userId: user._id }, process.env.secret, { expiresIn: '7d' })
    res.status(200).json({ message: 'Te has logueado exitosamente', token })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar iniciar sesión.' })
  }
}

const updateUser = async (req, res) => {
  try {
    const { emailAddress, phoneNumber, description } = req.body
    if (emailAddress === '' || phoneNumber === '' || description === '') {
      return res.status(400).json({ error: 'No puedes dejar ninguno de los campos vacíos' })
    }

    const currentUser = await User.findById(req.params.id)
    if (!currentUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (emailAddress) {
      const emailRegex = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/
      if (!emailRegex.test(emailAddress)) {
        return res.status(400).json({ error: 'El correo electrónico debe ser un correo válido' })
      }
    }

    if (phoneNumber) {
      const phoneRegex = /^\+58\d{10}$/
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ error: 'El nº de teléfono debe seguir el formato. Ejemplo: +584123215485' })
      }
    }

    const updatedFields = {}
    if (emailAddress && emailAddress !== currentUser.emailAddress) {
      updatedFields.emailAddress = emailAddress
    }
    if (phoneNumber && phoneNumber !== currentUser.phoneNumber) {
      updatedFields.phoneNumber = phoneNumber
    }
    if (description && description !== currentUser.description) {
      updatedFields.description = description
    }

    if (req.file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'El formato de imagen no es válido. Solo se permiten archivos JPEG, PNG y GIF.' })
      }

      const result = await cloudinary.uploader.upload(req.file.path)
      if (!result || !result.secure_url) {
        return res.status(500).json({ error: 'Error al subir la imagen' })
      }
      updatedFields.profilePicture = result.secure_url
    }

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ error: 'No hay cambios en la información proporcionada.' })
    }

    const user = await User.findByIdAndUpdate(req.params.id, updatedFields, { new: true })

    res.status(200).json({ message: 'Sus datos fueron actualizados', user })
  } catch (error) {
    console.log(error)

    if (error.code === 11000) {
      if (error.keyPattern.emailAddress) {
        return res.status(400).json({ error: 'Ese correo ya está registrado. Por favor, escoja otro' })
      } else if (error.keyPattern.phoneNumber) {
        return res.status(400).json({ error: 'Ese número de teléfono ya está registrado. Por favor, escoja otro' })
      }
    }
    res.status(500).json({ error: 'Ocurrió un error al intentar actualizar el usuario.' })
  }
}

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body
    const userId = req.params.id

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    const passwordRegex = /^(?=.*[0-9])/
    if (newPassword.length < 6 || !passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres y un número' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' })
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la contraseña actual' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'La nueva contraseña y la confirmación no coinciden' })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedNewPassword
    await user.save()

    res.status(200).json({ message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar cambiar la contraseña.' })
  }
}

module.exports = { userSignUp, userLogin, updateUser, changePassword, getUser }
