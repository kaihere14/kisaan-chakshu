import express from "express";
import healthRouter from "./health/health.route.js";
import { createClaimRouter } from "./claim/claim.route.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { createAuthRouter } from "./auth/auth.route.js";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use("/api/auth", createAuthRouter());
app.use("/api/health", healthRouter);
app.use("/api/claims", createClaimRouter());
app.get("/", (req, res) => {
  res.status(200).json({message:"Server up and running"})
})
app.use((_request, response) => { response.status(404).json({ error: { code: "not_found", message: "Route not found." } }); });
app.use(errorMiddleware);

export default app;
