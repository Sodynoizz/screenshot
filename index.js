import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const capture = async (url, width = 1080, height = 1920) => {
  const options = process.env.AWS_REGION
    ? {
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--single-process",
        ],
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreDefaultArgs: ["--disable-extensions"],
      }
    : {
        args: [],
        executablePath:
          process.platform === "win32"
            ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
            : process.platform === "linux"
            ? "/usr/bin/google-chrome"
            : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      };

  const browser = await puppeteer.launch(options);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(url, { waitUntil: "networkidle0" });
    return await page.screenshot({ type: "jpeg", omitBackground: true });
  } finally {
    await browser.close();
  }
};

app.post("/screenshot", async (req, res) => {
  try {
    const file = await capture(req.body.url);
    res.setHeader("Content-Type", `image/jpeg`);
    res.setHeader(
      "Cache-Control",
      `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`
    );
    res.statusCode = 200;
    res.end(file);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
