const Chapter = require('../models/Chapter');
const redis = require('../config/redis');
const { validateQuery, validateChapters } = require('../utils/validation');

// Helper to build cache key
const buildCacheKey = (base, query) => {
  const queryString = Object.entries(query).sort().map(([k, v]) => `${k}=${v}`).join('&');
  return `${base}?${queryString}`;
};




// Service to get a single chapter
const getChapterService = async (chapterId) => {
  const cacheKey = `chapter:${chapterId}`;

  // Try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return { cached: true, data: JSON.parse(cached) };
  }

  // If not cached, fetch from DB
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    return { error: 'Chapter not found' };
  }

  // Store in cache for future (optional: set TTL)
  await redis.set(cacheKey, JSON.stringify(chapter), 'EX', 3600); // Cache for 1 hour

  return { cached: false, data: chapter };
};




// Service to upload chapters
const uploadChaptersService = async (chaptersData) => {
  const validation = validateChapters(chaptersData);
  const uploaded = [];
  const failed = validation.invalid;

  if (validation.valid.length > 0) {
    try {
      const saved = await Chapter.insertMany(validation.valid, { ordered: false });
      uploaded.push(...saved);

      // Invalidate cache for the uploaded chapters
      const cacheKeys = uploaded.map(chapter => `chapter:${chapter._id}`);
      cacheKeys.push('chapters:all'); // Also invalidate the cache for the list of all chapters

      try {
        await redis.del(...cacheKeys); // Remove specific keys from Redis
      } catch (cacheErr) {
        console.warn('Cache invalidation failed:', cacheErr.message);
      }
    } catch (bulkError) {
      if (bulkError.writeErrors) {
        bulkError.writeErrors.forEach(err => {
          failed.push({
            index: err.index,
            chapter: validation.valid[err.index],
            errors: [err.errmsg || 'Database error'],
          });
        });
      }
    }
  }

  return { uploaded, failed };
};




// Service to get chapters with filtering and pagination
const getChaptersService = async (query) => {
    const { error, value: validatedQuery } = validateQuery(query);
    if (error) {
      return { error: 'Invalid query parameters', details: error.details.map(detail => detail.message) };
    }
  
    const { class: className, unit, status, weakChapters, subject, page, limit } = validatedQuery;
    const filter = {};
  
    if (className) filter.class = className;
    if (unit) filter.unit = unit;
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (weakChapters) filter.isWeakChapter = weakChapters === 'true';
  
    const skip = (page - 1) * limit;
  
    // Redis caching
    const cacheKey = buildCacheKey('/api/v1/chapters', validatedQuery);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return { cached: true, data: JSON.parse(cached) };
    }
  
    // If not cached, fetch from DB
    const [chapters, totalChapters] = await Promise.all([
      Chapter.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      Chapter.countDocuments(filter),
    ]);
  
    const totalPages = Math.ceil(totalChapters / limit);
    const response = {
      success: true,
      count: chapters.length,
      totalChapters,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      data: chapters,
      cached: false,
    };
  
    // Store in Redis (1 hour)
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 3600);
  
    return response;
  };
  


module.exports = {
  getChaptersService,
  getChapterService,
  uploadChaptersService,
};