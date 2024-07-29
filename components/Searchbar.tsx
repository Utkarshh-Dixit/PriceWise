"use client";

import { scrapeAndStoreProduct } from "@/lib/actions";
import { FormEvent, useState } from "react";

const isValidAmazonProductUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    if (
      hostname.includes("www.amazon.com") ||
      hostname.includes("amazon.in") ||
      hostname.includes("amazon.co") ||
      hostname.includes("amazon")
    ) {
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
};

const Searchbar = () => {
  const [searchPrompt, setsearchPrompt] = useState("");
  const [isLoading, setisLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidUrl = isValidAmazonProductUrl(searchPrompt);

    if (!isValidUrl) {
      alert("Please enter a valid Amazon product URL");
      return;
    }

    try {
      setisLoading(true);

      const product = await scrapeAndStoreProduct(searchPrompt);
    } catch (error) {
      console.error(error);
    } finally {
      setisLoading(false);
    }
  };
  return (
    <form className="flex flex-wrap gap-4 mt-12" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter product link"
        value={searchPrompt}
        onChange={(e) => setsearchPrompt(e.target.value)}
        className="searchbar-input"
      />
      <button
        type="submit"
        className="searchbar-btn"
        disabled={searchPrompt === ""}
      >
        {isLoading ? "Loading..." : "Search"}
      </button>
    </form>
  );
};

export default Searchbar;
