const mongoose = require('mongoose');
const URI = process.env.URI

const connectDb = async () => {
    try {
        await mongoose.connect(URI);
        console.log('Base de datos con MongoDB conectada');
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = connectDb