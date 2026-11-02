import express from "express";
import healthRouter from "./health/health.route.js";

const app = express();

app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/", (req, res) => {
  res.status(200).json({message:"Server up and running"})
})



export default app;
