import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
  title: String,
  destination: String,
  duration: String,
  discount: String,
  price: String,
  oldPrice: String,
  image: String,
  description: String,
});

const Deal = mongoose.model("Deal", dealSchema);

export default Deal; 
