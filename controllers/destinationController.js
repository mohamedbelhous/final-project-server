import mongoose from "mongoose";
import Destination from "../models/Destination.js";
import { searchUnsplashPhotos } from "../services/unsplashService.js";

// ---------------------------------------------------------
// Helper: Escape special regex characters
// ---------------------------------------------------------

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ---------------------------------------------------------
// Helper: Get Unsplash images safely
// ---------------------------------------------------------

const getUnsplashImages = async (query, perPage = 5) => {
  if (!query) {
    return [];
  }

  try {
    return await searchUnsplashPhotos(query, perPage);
  } catch (error) {
    console.error(`Unsplash error for "${query}":`, error.message);

    return [];
  }
};

// ---------------------------------------------------------
// Helper: Get one Unsplash image
// Supports multiple fallback queries
// ---------------------------------------------------------

const getUnsplashImage = async (query, fallbackQueries = []) => {
  const queries = [query, ...fallbackQueries].filter(Boolean);

  for (const currentQuery of queries) {
    const images = await getUnsplashImages(currentQuery, 1);

    if (images.length > 0 && images[0]?.url) {
      return images[0].url;
    }
  }

  return null;
};

// ---------------------------------------------------------
// Helper: Build alternative Activity image queries
// ---------------------------------------------------------

const buildActivityImageQueries = (activity, destination) => {
  const title = activity?.title || "";

  const destinationName = destination?.name || "";

  const location = destination?.location || "";

  const cleanedTitle = title
    .replace(
      /\b(hike|hiking|trip|tour|touring|visit|visiting|exploring|explore|at|around|over|of|the|to|in|on|and)\b/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  return [
    `${title} ${destinationName} Algeria`,
    `${cleanedTitle} ${destinationName} Algeria`,
    `${cleanedTitle} ${location} Algeria`,
    `${destinationName} Algeria`,
  ];
};

// ---------------------------------------------------------
// Get all destinations
// GET /api/destinations
// ---------------------------------------------------------

export const getDestinations = async (req, res) => {
  try {
    const { category, search } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = {
        $regex: escapeRegex(search),
        $options: "i",
      };
    }

    const destinations = await Destination.find(query).lean();

    // -------------------------------------------------------
    // Add dynamic Unsplash hero image
    // to every destination
    // -------------------------------------------------------

    const enrichedDestinations = await Promise.all(
      destinations.map(async (destination) => {
        let heroImage = null;

        // First try imageQuery
        if (destination.imageQuery) {
          heroImage = await getUnsplashImage(destination.imageQuery, [
            `${destination.name} Algeria`,
            `${destination.name} Algeria travel`,
            `${destination.location || ""} Algeria`,
          ]);
        }

        // Fallback to stored images
        heroImage =
          heroImage ||
          destination.heroImage ||
          destination.imageUrl ||
          destination.image ||
          null;

        return {
          ...destination,
          heroImage,
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: enrichedDestinations.length,
      data: enrichedDestinations,
    });
  } catch (error) {
    console.error("Get destinations error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch destinations",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------
// Get single destination by ID / Slug / Name
// GET /api/destinations/:id
// ---------------------------------------------------------

export const getDestinationById = async (req, res) => {
  try {
    const { id } = req.params;

    const cleanId = decodeURIComponent(id).trim();

    const safeId = escapeRegex(cleanId);

    const formattedName = escapeRegex(cleanId.replace(/-/g, " "));

    const formattedSlug = escapeRegex(
      cleanId.replace(/\s+/g, "-").toLowerCase(),
    );

    // -----------------------------------------------------
    // Build possible destination queries
    // -----------------------------------------------------

    const queryConditions = [
      {
        slug: new RegExp(`^${safeId}$`, "i"),
      },

      {
        slug: new RegExp(`^${formattedSlug}$`, "i"),
      },

      {
        name: new RegExp(`^${safeId}$`, "i"),
      },

      {
        name: new RegExp(`^${formattedName}$`, "i"),
      },

      {
        name: {
          $regex: safeId,
          $options: "i",
        },
      },

      {
        id: cleanId,
      },
    ];

    // Numeric ID
    if (!isNaN(cleanId) && cleanId !== "") {
      queryConditions.push({
        id: Number(cleanId),
      });
    }

    // MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      queryConditions.push({
        _id: cleanId,
      });
    }

    // -----------------------------------------------------
    // Find destination
    // -----------------------------------------------------

    const destination = await Destination.findOne({
      $or: queryConditions,
    }).lean();

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination '${cleanId}' not found`,
      });
    }

    // -----------------------------------------------------
    // Fetch Hero image from Unsplash
    // -----------------------------------------------------

    let heroImages = [];

    if (destination.imageQuery) {
      heroImages = await getUnsplashImages(destination.imageQuery, 1);
    }

    // -----------------------------------------------------
    // Fetch Gallery images from Unsplash
    // -----------------------------------------------------

    let galleryImages = [];

    if (
      Array.isArray(destination.galleryQueries) &&
      destination.galleryQueries.length > 0
    ) {
      const galleryResults = await Promise.all(
        destination.galleryQueries.map((query) => getUnsplashImages(query, 1)),
      );

      galleryImages = galleryResults.flat().filter((image) => image?.url);
    }

    // -----------------------------------------------------
    // Final Hero image
    // -----------------------------------------------------

    const finalHeroImage =
      heroImages[0]?.url ||
      destination.heroImage ||
      destination.imageUrl ||
      destination.image ||
      null;

    // -----------------------------------------------------
    // Final Gallery images
    // -----------------------------------------------------

    const finalGalleryImages =
      galleryImages.length > 0
        ? galleryImages.map((image) => image.url)
        : destination.galleryImages || [];

    // -----------------------------------------------------
    // Enrich Activities with Unsplash images
    // -----------------------------------------------------

    const activities = Array.isArray(destination.activities)
      ? await Promise.all(
          destination.activities.map(async (activity) => {
            const imageQueries = buildActivityImageQueries(
              activity,
              destination,
            );

            const image =
              (await getUnsplashImage(activity.imageQuery, imageQueries)) ||
              activity.image ||
              finalHeroImage ||
              null;

            return {
              ...activity,
              image,
            };
          }),
        )
      : [];

    // -----------------------------------------------------
    // Enrich Attractions with Unsplash images
    // -----------------------------------------------------

    const attractions = Array.isArray(destination.attractions)
      ? await Promise.all(
          destination.attractions.map(async (attraction) => {
            const image =
              (await getUnsplashImage(attraction.imageQuery)) ||
              attraction.image ||
              finalHeroImage ||
              null;

            return {
              ...attraction,
              image,
            };
          }),
        )
      : [];

    // -----------------------------------------------------
    // Build final enriched destination
    // -----------------------------------------------------

    const enrichedDestination = {
      ...destination,

      imageQuery: destination.imageQuery || null,

      heroImage: finalHeroImage,

      galleryImages: finalGalleryImages,

      activities,

      attractions,

      imageSource: heroImages.length > 0 ? "unsplash" : "fallback",

      gallerySource: galleryImages.length > 0 ? "unsplash" : "fallback",
    };

    // -----------------------------------------------------
    // Send response
    // -----------------------------------------------------

    res.status(200).json({
      success: true,
      data: enrichedDestination,
    });
  } catch (error) {
    console.error("Get destination details error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch destination details",
      error: error.message,
    });
  }
};
