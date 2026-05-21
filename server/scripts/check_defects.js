const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Defect = require('../models/Defect');
    const count = await Defect.countDocuments();
    const sample = await Defect.find().limit(3).lean();
    console.log('Defect count:', count);
    console.log('Sample defects:', JSON.stringify(sample, null, 2));
    
    // Check fields
    if (sample.length > 0) {
        console.log('\nAvailable fields on first defect:', Object.keys(sample[0]).join(', '));
    }
    process.exit(0);
}).catch(err => { console.error(err.message); process.exit(1); });
