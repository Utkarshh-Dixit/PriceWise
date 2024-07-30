import axios from "axios";
import * as cheerio from "cheerio";
import { extractPrice, extractCurrency } from "../utils";

export async function scrapeAmazonProduct(url: string) {
  if (!url) {
    throw new Error("Please provide a valid URL");
  }

  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);

  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;
  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: "brd.superproxy.io",
    port,
    rejectUnauthorized: false,
  };

  try {
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    const title = $("#productTitle").text().trim();
    const currentPrice = extractPrice(
      $(".priceToPay span.a-price-whole"),
      $("a.size.base.a-color-price"),
      $(".a-button-selected .a-color-base")
    );

    const originalPrice = extractPrice(
      $("#priceblock_ourprice"),
      $(".a-price.a-text-price span.a-offscreen"),
      $(".a-section span.aok-relative"),
      $("#listPrice"),
      $("#priceblock_dealprice"),
      $(".a-size-base.a-color-price")
    );

    const outOfStock =
      $("#availability span.a-size-medium.a-color-price")
        .text()
        .trim()
        .toLowerCase() === "currently unavailable";

    const image =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";

    const imageUrls = Object.keys(JSON.parse(image));

    const currency = extractCurrency($(".a-price-symbol"));

    const rating = $(".a-popover-trigger span.a-size-base.a-color-base")
      .text()
      .trim();

    const discountRate = $(".savingsPercentage").text().replace(/[-%]/g, "");

    const data = {
      url,
      currency: currency || "USD",
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice),
      originalPrice: Number(originalPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      stars: Number(rating),
      reviewCount: Number(rating) > 0 ? 1 : 0,
      isOutOfStock: outOfStock,
      category: "category",
    };

    console.log(data);
  } catch (error: any) {
    throw new Error(`Failed to scrape Amazon product: ${error.message}`);
  }
}