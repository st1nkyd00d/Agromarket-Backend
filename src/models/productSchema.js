const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'El ID del usuario es necesario'] },
  productName: { type: String, required: [true, 'El nombre del producto es necesario'] },
  productCategory: { type: String, required: [true, 'La categoría del producto es necesaria'] },
  productDescription: { type: String, required: [true, 'La descripción del producto es necesaria'] },
  productPrice: { type: Number, required: [true, 'El precio del producto es necesario'] },
  productAvailableAmount: { type: Number, required: [true, 'La cantidad del producto es necesaria'] },
  productImage: { type: String }
})

module.exports = mongoose.model('Product', productSchema)
