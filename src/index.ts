import express, { Express } from "express";
import dotenv from "dotenv";

dotenv.config();

const bootServer = async () => {
  const app: Express = express();
  const PORT = process.env.PORT || 9000;

  app.get("/", (_req, res) => {
    res.status(200).send("Yes your app is ready to word");
  });

  app.listen(PORT, () => {
    console.log(`your app is successfully up:- http://localhost:${PORT}`);
  });
};

bootServer();