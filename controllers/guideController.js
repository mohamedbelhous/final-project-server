
import mongoose from "mongoose";
import Guide from "../models/Guide.js";

// إنشاء slug من عنوان المقال
const createSlug = (title) => {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// التحقق من صلاحية معرّف المقال
const findGuide = async (id) => {
  if (mongoose.isValidObjectId(id)) {
    const guide = await Guide.findById(id);
    if (guide) return guide;
  }

  return Guide.findOne({ slug: id });
};

// 1. جلب المقالات المنشورة للزوار
export const getPublishedGuides = async (req, res) => {
  try {
    const guides = await Guide.find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: guides.length,
      data: guides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch articles.",
    });
  }
};

// 2. جلب مقال منشور واحد
export const getPublishedGuideById = async (req, res) => {
  try {
    const guide = await findGuide(req.params.id);

    // لا نعرض المسودات للزوار
    if (!guide || guide.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: guide,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch article.",
    });
  }
};

// 3. جلب جميع المقالات للمدير، بما فيها المسودات
export const getAllGuidesForAdmin = async (req, res) => {
  try {
    const guides = await Guide.find()
      .sort({ updatedAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: guides.length,
      data: guides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin articles.",
    });
  }
};

// 4. إضافة مقال جديد
export const createGuide = async (req, res) => {
  try {
    const { title, excerpt, image, category, content, readTime, status, tags } =
      req.body;

    if (
      !title?.trim() ||
      !excerpt?.trim() ||
      !category?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, excerpt, and category are required.",
      });
    }

    const slug = createSlug(title);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid article title.",
      });
    }

    const existingGuide = await Guide.findOne({ slug });

    if (existingGuide) {
      return res.status(409).json({
        success: false,
        message: "An article with this title already exists. Choose another title.",
      });
    }

    const articleStatus =
      status === "published" ? "published" : "draft";

    const guide = await Guide.create({
      title: title.trim(),
      slug,
      excerpt: excerpt.trim(),
      image,
      category: category.trim(),
      content: Array.isArray(content) ? content : [],
      readTime,
      status: articleStatus,
      tags: Array.isArray(tags) ? tags : [],
      author: req.user._id,
      publishedAt:
        articleStatus === "published" ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: "Article created successfully.",
      data: guide,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An article with this slug already exists.",
      });
    }

    console.error("Create guide error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create article.",
    });
  }
};

// 5. تعديل مقال
export const updateGuide = async (req, res) => {
  try {
    const guide = await findGuide(req.params.id);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    const allowedFields = [
      "title",
      "excerpt",
      "image",
      "category",
      "content",
      "readTime",
      "status",
      "tags",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        guide.set(field, req.body[field]);
      }
    }

    if (req.body.title !== undefined) {
      if (!req.body.title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty.",
        });
      }

      const newSlug = createSlug(req.body.title);

      if (!newSlug) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid article title.",
        });
      }

      const duplicate = await Guide.findOne({
        slug: newSlug,
        _id: { $ne: guide._id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Another article already uses this title.",
        });
      }

      guide.slug = newSlug;
    }

    if (
      req.body.status !== undefined &&
      !["draft", "published"].includes(req.body.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Status must be draft or published.",
      });
    }

    if (
      req.body.status === "published" &&
      guide.status !== "published"
    ) {
      guide.publishedAt = new Date();
    }

    if (req.body.status === "draft") {
      guide.publishedAt = null;
    }

    await guide.save();

    res.status(200).json({
      success: true,
      message: "Article updated successfully.",
      data: guide,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An article with this slug already exists.",
      });
    }

    console.error("Update guide error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update article.",
    });
  }
};

// 6. حذف مقال
export const deleteGuide = async (req, res) => {
  try {
    const guide = await findGuide(req.params.id);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    await guide.deleteOne();

    res.status(200).json({
      success: true,
      message: "Article deleted successfully.",
    });
  } catch (error) {
    console.error("Delete guide error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete article.",
    });
  }
};