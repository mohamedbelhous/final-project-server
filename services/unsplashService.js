const UNSPLASH_API_URL = "https://api.unsplash.com";

const cache = new Map();

const CACHE_DURATION = 1000 * 60 * 60; // ساعة واحدة

export const searchUnsplashPhotos = async (query, perPage = 5) => {
  if (!query) {
    throw new Error("Search query is required");
  }

  const cacheKey = `${query}-${perPage}`;

  // Check cache
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY is not configured");
  }

  const url = new URL(`${UNSPLASH_API_URL}/search/photos`);

  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "landscape");

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Unsplash API error (${response.status}): ${errorText}`,
    );
  }

  const result = await response.json();

  const photos = result.results.map((photo) => ({
    id: photo.id,

    url: photo.urls.regular,
    smallUrl: photo.urls.small,

    alt: photo.alt_description || photo.description || query,

    photographer: photo.user?.name || "Unknown",
    photographerUrl: photo.user?.links?.html || null,

    unsplashUrl: photo.links?.html || null,
  }));

  // Save in cache
  cache.set(cacheKey, {
    timestamp: Date.now(),
    data: photos,
  });

  return photos;
};
