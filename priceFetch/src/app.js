import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import priceRoutes from "./routes/priceRoutes.js";
import namadaRoutes from "./routes/namadaRoutes.js";
import { wasmService } from "./services/wasmService.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use("/api/v1", priceRoutes);
app.use("/api/v1", namadaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});

// Initialize WASM module and start server
async function startServer() {
    try {
        await wasmService.init();
        app.listen(config.servePort, () => {
            console.log(`Server running on port ${config.servePort}`);
        });
    } catch (error) {
        console.error('Failed to initialize WASM module:', error);
        process.exit(1);
    }
}

startServer(); 