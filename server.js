const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("CartIQ API running");
});

// eBay price
async function getEbayPrices(game) {
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(game)}&LH_Sold=1`;
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  let prices = [];

  $(".s-item").each((i, el) => {
    const text = $(el).find(".s-item__price").text();
    const price = parseFloat(text.replace(/[^0-9.]/g, ""));
    if (price) prices.push(price);
  });

  return prices;
}

// simple average
function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a,b)=>a+b,0)/arr.length;
}

// main endpoint
app.get("/market/:game", async (req, res) => {
  const game = req.params.game;

  try {
    const ebay = await getEbayPrices(game);
    const price = Math.round(avg(ebay));

    res.json({
      game,
      price,
      samples: ebay.length
    });

  } catch (err) {
    res.status(500).json({ error: "Error fetching price" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
