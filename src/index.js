import app from "./lib/app.js";
import { config } from "dotenv";
config()

const PORT = process.env.PORT || 3001;

// Global error handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason instanceof Error) {
        console.error('Stack:', reason.stack);
    }
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    // Restart the server
    process.exit(1);
});

const server = app.listen(PORT, () => {
    console.log(`✅ App running on http://localhost:${PORT}`);
    console.log(`📝 Docs available at http://localhost:${PORT}/docs`);
});

// Listen for server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`⚠️  Port ${PORT} is already in use`);
    }
});
