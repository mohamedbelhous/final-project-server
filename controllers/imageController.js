import { searchUnsplashPhotos } from "../services/unsplashService.js";

export const searchImages = async (req, res) => {
  try {
    const { query, perPage = 5 } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    const parsedPerPage = Math.min(
      Math.max(Number(perPage) || 5, 1),
      30,
    );

    const photos = await searchUnsplashPhotos(
      query.trim(),
      parsedPerPage,
    );

    res.status(200).json({
      success: true,
      query: query.trim(),
      count: photos.length,
      data: photos,
    });
  } catch (error) {
    console.error("Unsplash search error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch images from Unsplash",
      error: error.message,
    });
  }
};
