require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const MY_EMAIL = process.env.MY_EMAIL;
const GEMINI_KEY = process.env.GEMINI_KEY;

// ================= helper functions =================

function fibSeries(n) {
  let arr = [0, 1];
  for (let i = 2; i < n; i++) {
    arr.push(arr[i - 1] + arr[i - 2]);
  }
  return arr.slice(0, n);
}

function checkPrime(num) {
  if (num < 2) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function hcfArr(arr) {
  return arr.reduce((acc, val) => gcd(acc, val));
}

function lcmArr(arr) {
  return arr.reduce((acc, val) => (acc * val) / gcd(acc, val));
}

// ================= routes =================

app.post("/bfhl", async (req, res) => {
  try {
    let data;

    if (req.body.fibonacci) {
      const n = parseInt(req.body.fibonacci);
      if (!n || n <= 0) {
        return res.status(400).json({ is_success: false, error: "bad input" });
      }
      data = fibSeries(n);

    } else if (req.body.prime) {
      const arr = req.body.prime;
      if (!Array.isArray(arr)) {
        return res.status(400).json({ is_success: false, error: "bad input" });
      }
      data = arr.filter(checkPrime);

    } else if (req.body.lcm) {
      data = lcmArr(req.body.lcm);

    } else if (req.body.hcf) {
      data = hcfArr(req.body.hcf);

    } else if (req.body.AI) {
      const question = req.body.AI;

      const resp = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          contents: [
            {
              parts: [{ text: question }]
            }
          ]
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const answer =
        resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Unknown";

      data = answer.split(" ")[0];

    } else {
      return res.status(400).json({ is_success: false, error: "no valid key" });
    }

    res.json({
      is_success: true,
      official_email: MY_EMAIL,
      data: data
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ is_success: false, error: "server error" });
  }
});

app.get("/health", (req, res) => {
  res.json({
    is_success: true,
    official_email: MY_EMAIL
  });
});

module.exports = app;
