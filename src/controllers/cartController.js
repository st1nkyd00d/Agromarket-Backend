const Cart = require('../models/cartSchema')
const Product = require('../models/productSchema')
const User = require('../models/userSchema')
const Transaction = require('../models/transactionSchema')

const getCart = async (req, res) => {
  try {
    const { userId } = req.params
    let cart = await Cart.findOne({ userId }).populate('products.product')
    if (!cart) {
      cart = {
        userId,
        products: [],
        totalPrice: 0,
        totalItems: 0
      }
    }
    res.status(200).json(cart)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al obtener el carrito.' })
  }
}
const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    let cart = await Cart.findOne({ userId }).populate('products.product')

    if (cart) {
      const firstProduct = cart.products[0]

      if (firstProduct && !firstProduct.product.userId.equals(product.userId)) {
        return res.status(400).json({ error: 'No se puede agregar al carrito productos de otro vendedor' })
      }

      const productIndex = cart.products.findIndex((p) => p.product._id.equals(productId))
      if (productIndex > -1) {
        cart.products[productIndex].quantity += quantity
      } else {
        cart.products.push({ product: productId, quantity })
      }
    } else {
      cart = new Cart({
        userId,
        products: [{ product: productId, quantity }]
      })
    }

    await cart.save()
    res.status(200).json(cart)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al agregar al carrito.' })
  }
}

const updateCartItemQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body

    if (quantity < 1) {
      return res.status(400).json({ error: 'La cantidad debe ser al menos 1.' })
    }

    const cart = await Cart.findOne({ userId }).populate('products.product')
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado.' })
    }

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' })
    }

    const productIndex = cart.products.findIndex((p) => p.product._id.equals(productId))
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito.' })
    }

    if (quantity > product.productAvailableAmount) {
      return res.status(400).json({ error: 'Cantidad solicitada supera la cantidad disponible.' })
    }

    cart.products[productIndex].quantity = quantity

    await cart.save()
    res.status(200).json(cart)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al actualizar la cantidad del producto en el carrito.' })
  }
}

const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body
    console.log(req.body)

    const cart = await Cart.findOne({ userId }).populate('products.product')
    console.log(cart)
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado.' })
    }

    const productIndex = cart.products.findIndex((p) => p.product._id.equals(productId))
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito.' })
    }

    cart.products.splice(productIndex, 1)

    await cart.save()
    res.status(200).json(cart)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al eliminar el producto del carrito.' })
  }
}

const checkoutCart = async (req, res) => {
  try {
    const { userId } = req.params

    const cart = await Cart.findOne({ userId }).populate('products.product')
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' })
    }

    let total = 0
    const updatedProducts = []
    const productsDetails = []

    for (let item of cart.products) {
      const product = await Product.findById(item.product._id)
      if (!product) {
        return res.status(404).json({ error: `Producto con ID ${item.product._id} no encontrado` })
      }
      if (product.productAvailableAmount < item.quantity) {
        return res.status(400).json({ error: `Cantidad insuficiente para el producto ${product.productName}` })
      }

      product.productAvailableAmount -= item.quantity
      total += product.productPrice * item.quantity
      updatedProducts.push(product)
      productsDetails.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.productPrice
      })
    }

    const purchaseTransaction = new Transaction({
      buyerId: userId,
      sellerId: updatedProducts[0].userId,
      transactionProducts: productsDetails,
      total,
      transactionType: 'Compra'
    })

    const saleTransaction = new Transaction({
      buyerId: userId,
      sellerId: updatedProducts[0].userId,
      transactionProducts: productsDetails,
      total,
      transactionType: 'Venta'
    })

    await purchaseTransaction.save()
    await saleTransaction.save()

    // Actualizar los productos
    for (let product of updatedProducts) {
      await product.save()
    }

    // Vaciar el carrito
    cart.products = []
    await cart.save()

    res.status(201).json({ message: 'Transacciones realizadas con éxito y carrito vaciado', purchaseTransaction, saleTransaction })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar realizar las transacciones.' })
  }
}

module.exports = { getCart, addToCart, updateCartItemQuantity, removeFromCart, checkoutCart }
