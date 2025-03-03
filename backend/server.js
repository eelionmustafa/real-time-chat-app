// Load environment variables from .env file
require("dotenv").config();

// Import required dependencies
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.io for real-time communication
const io = socketIo(server);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });

// Define the Message schema
const messageSchema = new mongoose.Schema({
  user: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// User schema for authentication
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Use middleware to parse JSON
app.use(express.json());

// Function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Token expires in 1 hour
  });
};

// API route to login and return a JWT token
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Middleware to protect routes (Verify JWT)
const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Expecting "Bearer token"

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = decoded; // Attach the decoded user data to the request object
    next();
  });
};

// API route to get all messages (protected by JWT)
app.get("/messages", authenticateJWT, async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Socket.io setup to handle real-time messaging
io.on("connection", (socket) => {
  console.log("A user connected");

  // Listen for incoming messages and broadcast to all clients
  socket.on("sendMessage", async (data) => {
    const message = new Message(data);
    try {
      await message.save();
      io.emit("message", data); // Emit message to all clients
    } catch (err) {
      console.log("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);