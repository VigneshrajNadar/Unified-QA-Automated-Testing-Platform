const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meghana_qa';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`Connected to MongoDB: ${MONGODB_URI.split('@')[1] || MONGODB_URI}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

// Exporting an empty mock 'db' to prevent immediate crashing on unmigrated routes that expect 'db.run'
// However, these routes will fail at runtime until they are fully migrated to Mongoose.
const db = {
    run: (query, params, cb) => { if(cb) cb(new Error("Route not migrated to MongoDB yet.")); },
    get: (query, params, cb) => { if(cb) cb(new Error("Route not migrated to MongoDB yet.")); },
    all: (query, params, cb) => { if(cb) cb(new Error("Route not migrated to MongoDB yet.")); }
};

module.exports = db;
module.exports.connectDB = connectDB;
