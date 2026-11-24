const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                message: "Invalid or expired token"
            });
        }

        req.user = decoded;
        next();
    });
}

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Connected"))
.catch(error => console.log(error));

// User Model
const User = mongoose.model("User", new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}));

// Register API
app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            userId: user._id
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed"
        });
    }
});
// Login API
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            userId: user._id,
            username: user.username
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed"
        });
    }
});

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
    userId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}));

// Create Blog
app.post("/api/blogs",authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
          const userId = req.user.userId;

        if (!title || !content || !userId) {
            return res.status(400).json({
                message: "Title, content and userId are required"
            });
        }

        const blog = await Blog.create({
            title,
            content,
            userId
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

// Get All Blogs (User Specific)
app.get("/api/blogs", async (req, res) => {
    try {
        const { userId } = req.query;

        let blogs;

        if (userId) {
            blogs = await Blog.find({ userId }).sort({
                createdAt: -1
            });
        } else {
            blogs = await Blog.find().sort({
                createdAt: -1
            });
        }

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

