const Transaction = require('../models/transactionSchema')
const User = require('../models/userSchema')
const Product = require('../models/productSchema')
const Cart = require('../models/cartSchema')

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
    res.status(200).json(transactions)
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al obtener las transacciones.' })
  }
}

const getTransactionsAsBuyer = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 5 } = req.query

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const transactions = await Transaction.find({ buyerId: userId, transactionType: 'Compra' })
      .populate('transactionProducts.productId', 'productName productPrice')
      .sort({ transactionDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    const totalTransactions = await Transaction.countDocuments({ buyerId: userId, transactionType: 'Compra' })
    const totalPages = Math.ceil(totalTransactions / limit)

    const transactionsWithCorrectTotal = transactions.map((transaction) => {
      const correctedTotal = transaction.transactionProducts.reduce((sum, item) => {
        return sum + item.productId.productPrice * item.quantity
      }, 0)
      return {
        ...transaction.toObject(),
        total: correctedTotal
      }
    })

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalTransactions,
      transactions: transactionsWithCorrectTotal
    })
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al obtener las transacciones del usuario como comprador.' })
  }
}

const getTransactionsAsSeller = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 5 } = req.query

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const transactions = await Transaction.find({ sellerId: userId, transactionType: 'Venta' })
      .populate('transactionProducts.productId', 'productName productPrice')
      .sort({ transactionDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    const totalTransactions = await Transaction.countDocuments({ sellerId: userId, transactionType: 'Venta' })
    const totalPages = Math.ceil(totalTransactions / limit)

    const transactionsWithCorrectTotal = transactions.map((transaction) => {
      const correctedTotal = transaction.transactionProducts.reduce((sum, item) => {
        return sum + item.productId.productPrice * item.quantity
      }, 0)
      return {
        ...transaction.toObject(),
        total: correctedTotal
      }
    })

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalTransactions,
      transactions: transactionsWithCorrectTotal
    })
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al obtener las transacciones del usuario como vendedor.' })
  }
}
const createTransaction = async (req, res) => {
  try {
    const { buyerId, transactionProducts } = req.body

    if (!buyerId || !transactionProducts || !Array.isArray(transactionProducts) || transactionProducts.length === 0) {
      return res.status(400).json({ error: 'Todos los campos son requeridos y deben incluir productos para la transacción' })
    }

    let total = 0
    const productsDetails = []
    let sellerId = null

    for (let item of transactionProducts) {
      const product = await Product.findById(item.productId)
      if (!product) {
        return res.status(404).json({ error: `Producto con ID ${item.productId} no encontrado` })
      }
      if (product.productAvailableAmount < item.quantity) {
        return res.status(400).json({ error: `Cantidad insuficiente para el producto ${product.productName}` })
      }

      total += product.productPrice * item.quantity
      productsDetails.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.productPrice
      })

      if (!sellerId) {
        sellerId = product.userId
      } else if (sellerId.toString() !== product.userId.toString()) {
        return res.status(400).json({ error: 'Todos los productos deben pertenecer al mismo vendedor' })
      }
    }

    const purchaseTransaction = new Transaction({
      buyerId,
      sellerId,
      transactionProducts: productsDetails,
      total,
      transactionType: 'Compra',
      transactionStatus: 'Pendiente'
    })

    const saleTransaction = new Transaction({
      buyerId,
      sellerId,
      transactionProducts: productsDetails,
      total,
      transactionType: 'Venta',
      transactionStatus: 'Pendiente'
    })

    await purchaseTransaction.save()
    await saleTransaction.save()

    await Cart.findOneAndUpdate({ userId: buyerId }, { products: [] })

    res.status(201).json({ message: 'Transacción generada. ¡No olvides confirmarla! ', purchaseTransaction, saleTransaction })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar generar la transacciones.' })
  }
}

const confirmTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params

    if (!transactionId) {
      return res.status(400).json({ error: 'El ID de la transacción es requerido.' })
    }

    const purchaseTransaction = await Transaction.findById(transactionId)
    if (!purchaseTransaction) {
      return res.status(404).json({ error: `Transacción con ID ${transactionId} no encontrada.` })
    }

    const saleTransaction = await Transaction.findOne({
      buyerId: purchaseTransaction.buyerId,
      sellerId: purchaseTransaction.sellerId,
      total: purchaseTransaction.total,
      transactionType: 'Venta',
      'transactionProducts.productId': { $in: purchaseTransaction.transactionProducts.map((p) => p.productId) }
    })

    if (!saleTransaction) {
      return res.status(404).json({ error: `Transacción de venta relacionada no encontrada.` })
    }

    purchaseTransaction.transactionStatus = 'Exitosa'
    saleTransaction.transactionStatus = 'Exitosa'

    await purchaseTransaction.save()
    await saleTransaction.save()

    for (let item of purchaseTransaction.transactionProducts) {
      const product = await Product.findById(item.productId)
      if (product) {
        product.productAvailableAmount -= item.quantity
        await product.save()
      }
    }

    res.status(200).json({ message: 'Transacción confirmada' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar confirmar las transacciones.' })
  }
}

const rejectTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params

    if (!transactionId) {
      return res.status(400).json({ error: 'El ID de la transacción es requerido.' })
    }

    const purchaseTransaction = await Transaction.findById(transactionId)
    if (!purchaseTransaction) {
      return res.status(404).json({ error: `Transacción con ID ${transactionId} no encontrada.` })
    }

    const saleTransaction = await Transaction.findOne({
      buyerId: purchaseTransaction.buyerId,
      sellerId: purchaseTransaction.sellerId,
      total: purchaseTransaction.total,
      transactionType: 'Venta',
      'transactionProducts.productId': { $in: purchaseTransaction.transactionProducts.map((p) => p.productId) }
    })

    if (!saleTransaction) {
      return res.status(404).json({ error: `Transacción de venta relacionada no encontrada.` })
    }

    purchaseTransaction.transactionStatus = 'Cancelada'
    saleTransaction.transactionStatus = 'Cancelada'

    await purchaseTransaction.save()
    await saleTransaction.save()

    res.status(200).json({ message: 'Transacciones canceladas con éxito.' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar cancelar las transacciones.' })
  }
}

const getPendingPurchases = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const transactions = await Transaction.find({ buyerId: userId, transactionType: 'Compra', transactionStatus: 'Pendiente' })
      .populate('transactionProducts.productId', 'productName productPrice')
      .sort({ transactionDate: -1 })

    const transactionsWithCorrectTotal = transactions.map((transaction) => {
      const correctedTotal = transaction.transactionProducts.reduce((sum, item) => {
        return sum + item.productId.productPrice * item.quantity
      }, 0)
      return {
        ...transaction.toObject(),
        total: correctedTotal
      }
    })

    res.status(200).json({
      totalTransactions: transactionsWithCorrectTotal.length,
      transactions: transactionsWithCorrectTotal
    })
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al obtener las transacciones pendientes de compra del usuario.' })
  }
}

module.exports = {
  getTransactions,
  getTransactionsAsBuyer,
  getTransactionsAsSeller,
  createTransaction,
  confirmTransaction,
  rejectTransaction,
  getPendingPurchases
}
