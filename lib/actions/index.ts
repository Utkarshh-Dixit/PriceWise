"use server";

import { revalidatePath } from "next/cache";
import { scrapeAmazonProduct } from "../scraper";
import { connectToDB } from "../mongoose";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import Product from "../models/product.model";
import { User } from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";

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

    let product = scrapedProduct;

    const existingProduct = await Product.findOne({ url: product.url });

    if (existingProduct) {
      const updatePriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: scrapedProduct.currentPrice },
      ];

      product = {
        ...scrapedProduct,
        priceHistory: updatePriceHistory,
        lowestPrice: getLowestPrice(updatePriceHistory),
        highestPrice: getHighestPrice(updatePriceHistory),
        averagePrice: getAveragePrice(updatePriceHistory),
      };
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      product,
      { upsert: true, new: true }
    );

    revalidatePath(`/products/${newProduct._id}`);
  } catch (error: any) {
    throw new Error(`Failed to scrape and store product ${error.message}`);
  }
}

export async function getProductById(productId: string) {
  try {
    connectToDB();

    const product = await Product.findOne({ _id: productId });

    if (!product) return null;

    return product;
  } catch (error) {
    console.log(error);
  }
}

export async function getAllProducts() {
  try {
    connectToDB();

    const products = await Product.find();

    if (!products) return null;
    return products;
  } catch (error) {
    console.log(error);
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    connectToDB();

    const currentProduct = await Product.findById(productId);

    if (!currentProduct) return null;

    const similarProducts = await Product.find({
      category: currentProduct.category,
      _id: { $ne: currentProduct._id },
    });

    return similarProducts;
  } catch (error) {
    console.log(error);
  }
}

export async function addUserEmailToProduct(
  productId: string,
  userEmail: string
) {
  try {
    const product = await Product.findById(productId);

    if (!product) return;

    const userExists = product.users.some(
      (user: User) => user.email === userEmail
    );

    if (!userExists) {
      product.users.push({ email: userEmail });
      await product.save();

      const emailContent = generateEmailBody(product, "WELCOME");

      await sendEmail(await emailContent, [userEmail]);
    }
  } catch (error) {
    console.log(error);
  }
}
