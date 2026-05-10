const express = require("express");
const cors = require("cors");
const searchRoutes = require("./routes/searchRoutes");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", searchRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("SmartCompare Backend is running 🚀");
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});