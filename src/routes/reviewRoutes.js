const express = require('express');
const router = express.Router();
const { createReview, getSellerReviews, getSellerAverageRating, getSellerReviewsPagination } = require('../controllers/reviewController');


// Nueva ruta para obtener todas las reseñas de un vendedor
router.get('/count/:sellerId', getSellerReviews);

// Nueva ruta para obtener todas las reseñas de un vendedor
router.get('/all/:sellerId', getSellerReviewsPagination);

// Nueva ruta para obtener el promedio de calificaciones de un vendedor
router.get('/average-rating/:sellerId', getSellerAverageRating);

// Ruta para crear una reseña
router.post('/create', createReview);

module.exports = router;
