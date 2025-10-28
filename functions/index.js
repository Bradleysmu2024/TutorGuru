/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);
const cors = require('cors')({ origin: true });

admin.initializeApp();

exports.api = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const path = req.path;
    
    // Create Payment Session
    if (path === '/create-payment-session' && req.method === 'POST') {
      try {
        const { paymentId, assignmentId, amount, assignmentTitle, tutorName } = req.body;

        if (!paymentId || !assignmentId || !amount) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: req.body.paymentMethodTypes || ['card'], // Only allow card payments
          line_items: [
            {
              price_data: {
                currency: 'sgd',
                product_data: {
                  name: assignmentTitle,
                  description: `Tutor: ${tutorName}`,
                },
                unit_amount: amount,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&assignment_id=${assignmentId}`,
          cancel_url: `${req.headers.origin}/assignment/${assignmentId}`,
          metadata: {
            paymentId,
            assignmentId,
            assignmentTitle,
            tutorName,
          },
        });

        return res.json({ url: session.url, sessionId: session.id });
      } catch (error) {
        console.error('Error creating session:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    // Verify Payment
    if (path.startsWith('/verify-payment/') && req.method === 'GET') {
      try {
        const sessionId = path.split('/verify-payment/')[1];
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items'] // to retrieve line_items details
        });

        return res.json({
          status: session.payment_status,
          paymentId: session.metadata?.paymentId,
          assignmentId: session.metadata?.assignmentId,
          amount: session.amount_total,
          // Use metadata first, or fallback to line_items
          assignmentTitle: session.metadata?.assignmentTitle || 
                          session.line_items?.data[0]?.description || 'N/A',
          tutorName: session.metadata?.tutorName || 'N/A'
        });
      } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    return res.status(404).json({ error: 'Not found' });
  });
});

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
