const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  name: { type: String, required: [true, 'El nombre es necesario'] },
  lastName: { type: String, required: [true, 'El apellido es necesario'] },
  nationalId: { type: String, required: [true, 'La cédula de identidad es necesaria'], unique: true },
  phoneNumber: {
    type: String,
    required: [true, 'El número de teléfono es necesario'],
    unique: true,
    match: [/^\+58\d{10}$/, 'El número de teléfono debe tener el formato +58 (10 dígitos)']
  },
  emailAddress: { type: String, required: [true, 'El correo electrónico es necesario'], unique: true },
  password: { type: String, required: true },
  description: { type: String },
  profilePicture: { type: String },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: [] }]
})

module.exports = mongoose.model('User', userSchema)
