const Review = require('../models/reviewSchema')
const User = require('../models/userSchema')

const getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params

    const seller = await User.findById(sellerId)
    console.log(seller)
    if (!seller) {
      return res.status(404).json({ error: 'Vendedor no encontrado' })
    }

    const reviews = await Review.find({ sellerId }).populate('buyerId', 'name lastName')

    res.status(200).json(reviews)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al obtener las reseñas.' })
  }
}

const getSellerReviewsPagination = async (req, res) => {
  try {
    const { sellerId } = req.params
    const { page = 1, limit = 3 } = req.query

    const seller = await User.findById(sellerId)
    if (!seller) {
      return res.status(404).json({ error: 'Vendedor no encontrado' })
    }

    const totalReviews = await Review.countDocuments({ sellerId })

    const reviews = await Review.find({ sellerId })
      .populate('buyerId', 'name lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()

    const totalPages = Math.ceil(totalReviews / limit)

    res.status(200).json({
      reviews,
      totalPages,
      currentPage: page,
      totalReviews
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al obtener las reseñas.' })
  }
}

const createReview = async (req, res) => {
  try {
    const { buyerId, sellerId, rating, comment } = req.body
    console.log({ buyerId, sellerId, rating, comment })

    if (!buyerId || !sellerId || !rating || !comment) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    const buyer = await User.findById(buyerId)
    const seller = await User.findById(sellerId)
    if (!buyer || !seller) {
      return res.status(404).json({ error: 'Comprador o vendedor no encontrado' })
    }

    const review = new Review({
      buyerId,
      sellerId,
      rating,
      comment
    })

    await review.save()

    res.status(201).json({ message: 'Reseña creada con éxito', review })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al intentar crear la reseña.' })
  }
}

const getSellerAverageRating = async (req, res) => {
  try {
    const { sellerId } = req.params

    const seller = await User.findById(sellerId)
    if (!seller) {
      return res.status(404).json({ error: 'Vendedor no encontrado' })
    }

    const reviews = await Review.find({ sellerId })

    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length

    res.status(200).json({ sellerId, averageRating })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al obtener el promedio de calificaciones.' })
  }
}

module.exports = { createReview, getSellerReviews, getSellerAverageRating, getSellerReviewsPagination }
