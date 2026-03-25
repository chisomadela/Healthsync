import e from "express";
import path from "path";
import { fileURLToPath } from "url";

import auth from "./routes/authenticationRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = e()

app.use(e.json())
app.use(e.static(path.join(__dirname, '../public')))
app.use("/auth", auth)

app.get("/", async(req, res) => {
    return res.json({message: "Healthsync api running"})
})

app.get("/docs", async(req, res) => {
    return res.sendFile(path.join(__dirname, '../public/docs.html'))
})

export default app;