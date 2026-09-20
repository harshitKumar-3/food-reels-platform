const mongoose = require('mongoose');
const foodModel = require('./src/models/food.model');
const foodPartnerModel = require('./src/models/foodpartner.model');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food-reels', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const partners = await foodPartnerModel.find().lean();
    console.log('partners', partners.length);
    if (partners.length === 0) {
      console.log('no partners');
      process.exit(0);
    }

    const first = partners[0];
    console.log('first', first._id.toString(), first.email);

    const foods = await foodModel.find({ foodPartner: first._id }).lean();
    console.log('foods', foods.length);
    foods.forEach((f) => console.log('  ', f._id.toString(), f.name, f.foodPartner.toString()));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();