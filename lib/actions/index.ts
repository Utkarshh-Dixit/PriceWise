"use server";

import { scrapeAmazonProduct } from "../scraper";
import { connectToDB } from "../mongoose";

export async function scrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) {
    throw new Error("Please provide a valid product URL");
  }

  try {
    connectToDB();

    const scrapedProduct = await scrapeAmazonProduct(productUrl);

    if (!scrapedProduct) {
      throw new Error("Failed to scrape product");
    }
  } catch (error: any) {
    throw new Error(`Failed to scrape and store product ${error.message}`);
  }
}
