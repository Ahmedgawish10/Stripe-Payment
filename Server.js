const express = require("express");
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")("sk_test_51P85jmLPTeuzPbczbWIjE4PIvfNMg12md2wXQUsdgkJouBkciMTn6HCON9apASZ34BgnEXw8GE7bp48PNxekvjdo00oWx0a3kO");

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
              name: "Total Amount of Order",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}OFTYU`,
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

    res.status(200).send(session);
  } catch (error) {
    console.error("Error fetching session:", );
    res.status(500).send({ error: error.message });
  }
});



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
