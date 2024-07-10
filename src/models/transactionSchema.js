const mongoose = require('mongoose')
const Schema = mongoose.Schema

const transactionSchema = new Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Es necesario el ID del comprador'] },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Es necesario el ID del vendedor'] },
  transactionDate: { type: Date, default: Date.now },
  transactionType: { type: String },
  transactionProducts: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: [true, 'Es necesario el ID del producto que desea comprar'] },
      quantity: { type: Number, required: [true, 'Es necesario ingresar una cantidad'] }
    }
  ],
  transactionStatus: { type: String, default: 'Pendiente' },
  total: { type: Number }
})

module.exports = mongoose.model('Transaction', transactionSchema)
