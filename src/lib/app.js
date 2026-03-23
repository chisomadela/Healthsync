import e from "express";

const app = e()

app.get("/", async(req, res) => {
    return res.json({message: "Healthsync api running"})
})


export default app;