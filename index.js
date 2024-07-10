require('dotenv').config()
const express = require('express')
const app = express()
const PORT = 3000 || process.env.PORT
const userRoutes = require('./src/routes/userRoutes')
const productRoutes = require('./src/routes/productRoutes')
const favoriteRoutes = require('./src/routes/favoriteRoutes')
const cartRoutes = require('./src/routes/cartRoutes')
const transactionRoutes = require('./src/routes/transactionRoutes')
const reviewRoutes = require('./src/routes/reviewRoutes')
const connectDb = require('./src/config/dbConnection')
const cors = require('cors')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

connectDb()

app.use('/user', userRoutes)
app.use('/product', productRoutes)
app.use('/favorite', favoriteRoutes)
app.use('/cart', cartRoutes)
app.use('/transaction', transactionRoutes)
app.use('/review', reviewRoutes)


app.listen(PORT, () => {
  console.log(`Server listening on PORT ${PORT}`)
})
