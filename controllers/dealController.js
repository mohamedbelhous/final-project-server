import Deal from "../models/Deal.js";

// @desc    Get all special deals
// @route   GET /api/deals
// @access  Public
export const getAllDeals = async (req, res) => {
  try {
    const deals = await Deal.find();
    res.status(200).json(deals);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get single deal by ID
// @route   GET /api/deals/:id
// @access  Public
export const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.status(200).json(deal);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Invalid ID or Server Error", error: error.message });
  }
};
