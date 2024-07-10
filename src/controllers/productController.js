const Product = require('../models/productSchema')
const cloudinary = require('../utils/cloudinary')

const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 6, category, searchQuery, filterOption } = req.query

    const filter = {}
    if (category) {
      filter.productCategory = category
    }
    if (searchQuery) {
      filter.productName = { $regex: searchQuery, $options: 'i' }
    }

    const skip = (page - 1) * limit

    let query = Product.find(filter).skip(skip).limit(parseInt(limit))

    if (filterOption === 'asc') {
      query = query.sort({ productPrice: 1 })
    } else if (filterOption === 'desc') {
      query = query.sort({ productPrice: -1 })
    } else if (filterOption === 'alphaAsc') {
      query = query.sort({ productName: 1 })
    } else if (filterOption === 'alphaDesc') {
      query = query.sort({ productName: -1 })
    }

    const products = await query
    const totalProducts = await Product.countDocuments(filter)

    res.status(200).json({
      products,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al obtener los productos.' })
  }
}

const getOneProduct = async (req, res) => {
  try {
    const productId = req.params.id
    console.log(productId)

    const product = await Product.findById(productId)

    if (!product) {
      return res.status(404).json({ error: 'Este producto no se encuentra en nuestra base de datos' })
    }

    res.status(200).json(product)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar recuperar los datos del producto' })
  }
}

const getProductsByUser = async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: 'El ID del usuario es requerido' })
    }

    const products = await Product.find({ userId })
    res.status(200).json(products)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al obtener los productos del usuario.' })
  }
}

const createProduct = async (req, res) => {
  try {
    const { userId, productName, productCategory, productDescription, productPrice, productAvailableAmount } = req.body
    console.log(req.body)

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo de imagen' })
    }

    const result = await cloudinary.uploader.upload(req.file.path)
    if (!result || !result.secure_url) {
      return res.status(500).json({ error: 'Error al subir la imagen' })
    }

    const imageUrl = result.secure_url

    if (!userId || !productName || !productCategory || !productDescription || !productPrice || !productAvailableAmount) {
      return res.status(400).json({ error: 'Es necesario llenar todos los campos para poder crear el producto' })
    }

    let formattedProductPrice = productPrice
    if (typeof productPrice === 'string' && productPrice.includes(',')) {
      formattedProductPrice = productPrice.replace(',', '.')
    }

    formattedProductPrice = parseFloat(formattedProductPrice).toFixed(2)

    const product = await Product.create({
      userId,
      productName,
      productCategory,
      productDescription,
      productPrice: formattedProductPrice,
      productAvailableAmount,
      productImage: imageUrl
    })

    res.status(201).json({ message: 'Producto creado exitosamente' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar crear el producto' })
  }
}

const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params
    const { productName, productCategory, productDescription, productPrice, productAvailableAmount } = req.body

    if (productName === '' || productCategory === '' || productDescription === '' || productPrice === '' || productAvailableAmount === '') {
      return res.status(400).json({ error: 'No puedes dejar ninguno de los campos vacíos' })
    }

    if (productPrice <= 0) {
      return res.status(400).json({ error: 'El precio del producto debe ser mayor a 0' })
    }
    if (productAvailableAmount <= 0) {
      return res.status(400).json({ error: 'La cantidad disponible del producto debe ser mayor a 0' })
    }

    const currentProduct = await Product.findById(productId)
    if (!currentProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    let formattedProductPrice = productPrice
    if (typeof productPrice === 'string' && productPrice.includes(',')) {
      formattedProductPrice = productPrice.replace(',', '.')
    }

    const updatedFields = {}
    if (productName && productName !== currentProduct.productName) {
      updatedFields.productName = productName
    }
    if (productCategory && productCategory !== currentProduct.productCategory) {
      updatedFields.productCategory = productCategory
    }
    if (productDescription && productDescription !== currentProduct.productDescription) {
      updatedFields.productDescription = productDescription
    }
    if (productPrice && formattedProductPrice !== currentProduct.productPrice.toString()) {
      updatedFields.productPrice = formattedProductPrice
    }
    if (productAvailableAmount && productAvailableAmount !== currentProduct.productAvailableAmount.toString()) {
      updatedFields.productAvailableAmount = productAvailableAmount
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
      updatedFields.productImage = result.secure_url
    }

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ error: 'No hay cambios en la información proporcionada.' })
    }

    const product = await Product.findByIdAndUpdate(productId, updatedFields, { new: true })

    res.status(200).json({ message: 'Producto actualizado exitosamente', product })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar actualizar el producto' })
  }
}

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params

    const product = await Product.findByIdAndDelete(productId)

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    res.status(200).json({ message: 'Producto eliminado exitosamente' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar eliminar el producto' })
  }
}

const getSellerByProductId = async (req, res) => {
  try {
    const { productId } = req.params

    const product = await Product.findById(productId).populate('userId')

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    const seller = product.userId

    return res.status(200).json({
      _id: seller._id,
      name: seller.name,
      lastName: seller.lastName,
      phoneNumber: seller.phoneNumber,
      emailAddress: seller.emailAddress,
      description: seller.description,
      profilePicture: seller.profilePicture
    })
  } catch (error) {
    console.error('Error al obtener el vendedor del producto:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const getProductCountByUser = async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: 'El ID del usuario es requerido' })
    }

    const productCount = await Product.countDocuments({ userId })

    res.status(200).json({ count: productCount })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al obtener la cantidad de productos del usuario.' })
  }
}

module.exports = { getAllProducts, getOneProduct, createProduct, getProductsByUser, updateProduct, deleteProduct, getSellerByProductId, getProductCountByUser }
