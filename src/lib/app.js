import e from "express";


import auth from "./routes/authenticationRoutes.js";


const app = e()

app.use(e.json())
app.use("/auth",auth)

app.get("/", async(req, res) => {
    return res.json({message: "Healthsync api running"})
})


export default app;