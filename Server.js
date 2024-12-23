const express = require("express");
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*", 
  })
);

// URLs for success and cancel of stripe
const successUrl =
  process.env.NODE_ENV === "production"
    ? process.env.SUCCESS_URL_PROD
    : process.env.SUCCESS_URL_DEV;

const cancelUrl =
  process.env.NODE_ENV === "production"
    ? process.env.CANCEL_URL_PROD
    : process.env.CANCEL_URL_DEV;

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount, currency } = req.body;
    if (!amount || !currency) {
      return res.status(400).send({ error: "Amount and currency are required." });
    }
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).send({ error: "Amount must be a positive number." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: "Sample Product",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    res.status(200).send({ sessionId: session.id });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).send({ error: error.message });
  }
});

app.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).send({ error: "Session not found" });
    }

    res.status(200).send( session);
  } catch (error) {
    console.error("Error fetching session:", error,process.env.STRIPE_SECRET_KEY);
    res.status(500).send({ error: error.message });
  }
});



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
