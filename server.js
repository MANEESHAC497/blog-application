
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Connected"))
.catch(error => console.log(error));

// Blog Model
const Blog = mongoose.model("Blog", new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}));

// Create Blog
app.post("/api/blogs", async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        const blog = await Blog.create({
            title,
            content
        });

        res.status(201).json({
            message: "Blog created successfully",
            blog
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create blog"
        });
    }
});

// Get All Blogs
app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find().sort({
            createdAt: -1
        });

        res.json(blogs);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch blogs"
        });
    }
});

// Get Single Blog
app.get("/api/blogs/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.json(blog);
    } catch (error) {
        res.status(400).json({
            message: "Invalid blog ID"
        });
    }
});

// Update Blog
app.put("/api/blogs/:id", async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            { title, content },
            { new: true, runValidators: true }
        );

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.json({
            message: "Blog updated successfully",
            blog
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to update blog"
        });
    }
});

// Delete Blog
app.delete("/api/blogs/:id", async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(
            req.params.id
        );

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.json({
            message: "Blog deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to delete blog"
        });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

