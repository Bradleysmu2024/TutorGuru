/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const stripe = require("stripe")(functions.config().stripe.secret_key);
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Create Payment Session (HTTP endpoint)
app.post("/create-payment-session", async (req, res) => {
  const { paymentId, assignmentId, amount, assignmentTitle, tutorName } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sgd",
            product_data: {
              name: assignmentTitle || "Assignment",
              description: `Tutor: ${tutorName || "N/A"}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // IMPORTANT: Use assignmentId in cancel_url
      success_url: `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}&payment_id=${paymentId}&assignment_id=${assignmentId}`,
      cancel_url: `http://localhost:5173/assignment/${assignmentId}`, // Use assignmentId here
      metadata: {
        paymentId: paymentId,
        assignmentId: assignmentId,
        tutorName: tutorName,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating payment session:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify Payment (HTTP endpoint)
app.get("/verify-payment/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      status: session.payment_status === "paid" ? "paid" : "unpaid",
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: error.message });
  }
});

exports.api = functions.https.onRequest(app);

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
