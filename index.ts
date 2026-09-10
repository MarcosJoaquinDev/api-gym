import express from "express";
import path from "node:path";
import { createRequire } from "node:module";
import { router } from "./src/routes.js";
import cors from "cors";

const require = createRequire(import.meta.url);
const packageDir = path.dirname(
  require.resolve("@bryllim/workout-guide/package.json"),
);
const assetsDir = path.join(packageDir, "assets");

const app = express();
app.use(cors());

const port = Number(process.env.PORT) || 3000;

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  next();
});

app.use(express.json());
app.use("/assets", express.static(assetsDir));

app.use("/api", router);

app.get("/", (_req, res) => {
  res.json({
    endpoints: {
      exercises: "/api/exercises",
      searchByName: "/api/exercises/search?q=bench",
      byMuscle: "/api/exercises/muscle/Chest",
      exerciseDetail: "/api/exercises/bench-press",
      muscles: "/api/muscles",
      frames: "/assets/bench-press/frame-1.png",
    },
  });
});

app.listen(port, () => {
  console.log(`API Gym escuchando en http://localhost:${port}`);
});
