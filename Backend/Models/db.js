const mongoose = require('mongoose');

// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log('✅ Database connected'))
//     .catch(err => console.error('❌ Database error:', err));

    mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Database connected'))
    .catch(err => {
        console.error('❌ Database connection error:', err);
        process.exit(1);  // Exit if database connection fails
    });