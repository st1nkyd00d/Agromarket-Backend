const User = require('../models/userSchema')
const Product = require('../models/productSchema')

const getFavorites = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId).populate('favorites')
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    res.status(200).json({ message: 'Productos favoritos recuperados', favorites: user.favorites })
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message })
  }
}

const addFavorite = async (req, res) => {
  try {
    const { userId, productId } = req.body

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }
    if (user.favorites.includes(productId)) {
      return res.status(400).json({ message: 'El producto ya está en favoritos' })
    }
    user.favorites.push(productId)
    await user.save()

    res.status(200).json({ message: 'Producto agregado a favoritos', favorites: user.favorites })
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message })
  }
}

const removeFavorite = async (req, res) => {
  try {
    const { userId, productId } = req.body
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }
    const favoriteIndex = user.favorites.indexOf(productId)
    if (favoriteIndex === -1) {
      return res.status(400).json({ message: 'El producto no está en favoritos' })
    }
    user.favorites.splice(favoriteIndex, 1)
    await user.save()

    res.status(200).json({ message: 'Producto eliminado de favoritos', favorites: user.favorites })
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message })
  }
}
module.exports = { getFavorites, addFavorite, removeFavorite }
