import app from "./lib/app.js";
import { config } from "dotenv";
config()


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`app running on http://localhost:${PORT}`)
})
