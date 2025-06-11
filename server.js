const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs")
const { GoogleGenAI, Modality } = require("@google/genai")

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = "your-secret-key-change-in-production"
const API_KEY = "AIzaSyBdAM1w0XoKfNspA8XM1CmBEL7u7goa6pM"

// Initialize Google GenAI (correct package)
const ai = new GoogleGenAI({ apiKey: API_KEY })

// Middleware
app.use(express.json({ limit: "50mb" }))
app.use(express.static("public"))
app.use("/uploads", express.static("uploads"))

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads")
}

// Initialize SQLite Database
const db = new sqlite3.Database("imagineai.db")

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  // Generated images table
  db.run(`CREATE TABLE IF NOT EXISTS generated_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    image_data TEXT NOT NULL,
    filename TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`)
})

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// Routes

// Serve HTML pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"))
})

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"))
})

app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "app.html"))
})

// Auth Routes
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    db.run(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(400).json({ error: "Username or email already exists" })
          }
          return res.status(500).json({ error: "Database error" })
        }

        const token = jwt.sign({ userId: this.lastID, username, email }, JWT_SECRET, { expiresIn: "24h" })

        res.json({
          message: "User created successfully",
          token,
          user: { id: this.lastID, username, email },
        })
      },
    )
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" })
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      const validPassword = await bcrypt.compare(password, user.password)
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      const token = jwt.sign({ userId: user.id, username: user.username, email: user.email }, JWT_SECRET, {
        expiresIn: "24h",
      })

      res.json({
        message: "Login successful",
        token,
        user: { id: user.id, username: user.username, email: user.email },
      })
    })
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

// Image Generation Route - Fixed version
app.post("/api/generate-image", authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" })
    }

    console.log("Generating image for prompt:", prompt)

    // Use the working Gemini API approach
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    })

    // Loop over all parts to find the image
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data
        const mimeType = part.inlineData.mimeType || "image/png"
        const base64Image = `data:${mimeType};base64,${imageData}`

        // Save to database
        db.run(
          "INSERT INTO generated_images (user_id, prompt, image_data) VALUES (?, ?, ?)",
          [req.user.userId, prompt, base64Image],
          function (err) {
            if (err) {
              console.error("Database error:", err)
              return res.status(500).json({ error: "Failed to save image" })
            }

            console.log("Image generated and saved successfully!")
            return res.json({
              success: true,
              imageId: this.lastID,
              imageData: base64Image,
              prompt,
            })
          },
        )
        return
      }
    }

    // If no image found in response
    res.status(500).json({ error: "No image generated in response" })
  } catch (error) {
    console.error("Image generation error:", error)
    res.status(500).json({
      error: "Failed to generate image",
      details: error.message,
    })
  }
})

// Get user's image history
app.get("/api/history", authenticateToken, (req, res) => {
  db.all(
    "SELECT id, prompt, image_data, created_at FROM generated_images WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Database error" })
      }
      res.json(rows)
    },
  )
})

// Download image
app.get("/api/download/:imageId", authenticateToken, (req, res) => {
  const imageId = req.params.imageId

  db.get("SELECT * FROM generated_images WHERE id = ? AND user_id = ?", [imageId, req.user.userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }

    if (!row) {
      return res.status(404).json({ error: "Image not found" })
    }

    // Extract base64 data
    const base64Data = row.image_data.split(",")[1]
    const buffer = Buffer.from(base64Data, "base64")

    res.setHeader("Content-Type", "image/png")
    res.setHeader("Content-Disposition", `attachment; filename="generated-image-${imageId}.png"`)
    res.send(buffer)
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})