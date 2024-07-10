const mongoose = require('mongoose')
const Schema = mongoose.Schema

const reviewSchema = new Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'El ID del comprador es necesario'] },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'El ID del vendedor es necesario'] },
  rating: { type: Number, min: 1, max: 5, required: [true, 'La calificación es necesaria'] },
  comment: { type: String, required: [true, 'El comentario es necesario'] },
  reviewDate: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Review', reviewSchema)
