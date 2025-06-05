const Chapter = require('../models/Chapter');
const redis = require('../config/redis');
const { validateQuery, validateChapters } = require('../utils/validation');

// Helper to build cache key
const buildCacheKey = (base, query) => {
  const queryString = Object.entries(query).sort().map(([k, v]) => `${k}=${v}`).join('&');
  return `${base}?${queryString}`;
};

// Get all chapters with filtering and pagination
const getChapters = async (req, res, next) => {
  try {
    const { error, value: validatedQuery } = validateQuery(req.query);
    if (error) {
        return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.details.map(detail => detail.message),
      });
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
      return res.status(200).json(JSON.parse(cached));
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

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getChapters:', error);
    next(error);
  }
};


// Get single chapter or multiple chapters
// GET /api/v1/chapters/:id
const getChapter = async (req, res, next) => {
  const chapterId = req.params.id;
  const cacheKey = `chapter:${chapterId}`;

  try {
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    // If not cached, fetch from DB
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, error: 'Chapter not found' });
    }

    // Store in cache for future (optional: set TTL)
    await redis.set(cacheKey, JSON.stringify(chapter), 'EX', 3600); // Cache for 1 hour

    res.status(200).json({
      success: true,
      data: chapter,
      cached: false,
    });
  } catch (error) {
    console.error('Error in getChapter:', error.message);
    next(error);
  }
};


// Upload chapters
// POST /api/v1/chapters
// Admin
const uploadChapters = async (req, res, next) => {
  try {
    let chaptersData;

    if (req.file) {
      try {
        const fileContent = req.file.buffer.toString('utf8');
        chaptersData = JSON.parse(fileContent);
      } catch (err) {
        return res.status(400).json({ success: false, error: 'Invalid JSON file format' });
      }
    } else if (Array.isArray(req.body)) {
      chaptersData = req.body;
    } else {
      return res.status(400).json({ success: false, error: 'No chapters data provided' });
    }

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

    // try {
    //   await redis.flushall(); // Clear all chapter-related caches
    // } catch (cacheErr) {
    //   console.warn('Cache flush failed:', cacheErr.message);
    // }

    res.status(201).json({
      success: true,
      message: `${uploaded.length} chapters uploaded`,
      data: {
        uploadedCount: uploaded.length,
        failedCount: failed.length,
        uploadedChapters: uploaded.map(c => ({ id: c._id, subject: c.subject, chapter: c.chapter, class: c.class })),
        failedChapters: failed.map(f => ({
          index: f.index,
          chapter: { subject: f.chapter.subject, chapter: f.chapter.chapter, class: f.chapter.class },
          errors: f.errors,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChapters,
  getChapter,
  uploadChapters,
};
