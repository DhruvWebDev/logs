import express from "express";
import * as prom from "prom-client";
import responseTime from "response-time";
import * as winston from "winston";
import LokiTransport from "winston-loki";

const app = express();

// 🛠 Loki Logger Setup
const lokiHost = process.env.LOKI_HOST || "http://loki:3100";
const logger = winston.createLogger({
  transports: [
    new LokiTransport({
      host: lokiHost,
    }),
  ],
});

logger.on("error", (err) => {
  console.error("Winston logger error:", err);
});

logger.info("Loki logger initialized with host: " + lokiHost);

// 📊 Prometheus Metrics
prom.collectDefaultMetrics({ register: prom.register });

const counter = new prom.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method"] as const,
});

const time = new prom.Histogram({
  name: "http_response_time",
  help: "Response time in milliseconds",
  labelNames: ["method", "route"],
  buckets: [0, 50, 100, 200, 500, 1000, 3000],
});

// 📏 Middleware: Response Time
app.use(
  responseTime((req, res, duration) => {
    const route = req.route?.path || req.path;
    time.labels(req.method, route).observe(duration);
    logger.info(`Response time for ${req.method} ${route}: ${duration.toFixed(2)}ms`);
  })
);

// 📈 Middleware: Count HTTP methods
app.use((req, res, next) => {
  counter.inc({ method: req.method });
  next();
});

// ⏱ Sleep helper
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// 🔁 Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
  logger.info("Home route hit");
});

app.get("/delay/1s", async (req, res) => {
  await sleep(1000);
  res.send("Delayed 1s");
  logger.info("/delay/1s route hit");
});

app.get("/delay/10s", async (req, res) => {
  await sleep(10000);
  res.send("Delayed 10s");
  logger.info("/delay/10s route hit");
});

app.get("/alert", (req, res) => {
  res.send("Alerting now...");
  logger.error("Alerting on purpose");
});


app.get("/delay/random", async (req, res) => {
  const delay = Math.floor(Math.random() * 1500) + 500;
  await sleep(delay);
  res.send(`Delayed ${delay}ms`);
  logger.info(`/delay/random route hit after ${delay}ms`);
});

app.get("/crash", (req, res) => {
  res.send("Crashing now...");
  logger.error("Crashing on purpose");
  process.exit(1);
});

app.get("/metrics", async (req, res) => {
  const metrics = await prom.register.metrics();
  res.set("Content-Type", prom.register.contentType);
  res.send(metrics);
  logger.info("/metrics endpoint hit");
});

// 🚀 Start server
app.listen(3000, () => {
  console.log("App listening on http://localhost:3000");
});
