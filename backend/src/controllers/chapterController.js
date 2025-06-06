const { getChaptersService, getChapterService, uploadChaptersService } = require('../services/chapterService');

// Get all chapters with filtering and pagination
const getChapters = async (req, res, next) => {
  try {
    const result = await getChaptersService(req.query);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details,
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getChapters:', error);
    next(error);
  }
};

// Get single chapter
const getChapter = async (req, res, next) => {
  try {
    const result = await getChapterService(req.params.id);

    if (result.error) {
      return res.status(404).json({ success: false, error: result.error });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      cached: result.cached,
    });
  } catch (error) {
    console.error('Error in getChapter:', error.message);
    next(error);
  }
};

// Upload chapters
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

    const { uploaded, failed } = await uploadChaptersService(chaptersData);

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