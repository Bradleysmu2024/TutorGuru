/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret_key);
const cors = require("cors")({ origin: true });
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

// Initialize SendGrid
sgMail.setApiKey(functions.config().sendgrid.api_key);

exports.api = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const path = req.path;

    // Create Payment Session
    if (path === "/create-payment-session" && req.method === "POST") {
      try {
        const { paymentId, assignmentId, amount, assignmentTitle, tutorName } =
          req.body;

        if (!paymentId || !assignmentId || !amount) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: req.body.paymentMethodTypes || ["card"], // Only allow card payments
          line_items: [
            {
              price_data: {
                currency: "sgd",
                product_data: {
                  name: assignmentTitle,
                  description: `Tutor: ${tutorName}`,
                },
                unit_amount: amount,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
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
        console.error("Error creating session:", error);
        return res.status(500).json({ error: error.message });
      }
    }

    // Verify Payment
    if (path.startsWith("/verify-payment/") && req.method === "GET") {
      try {
        const sessionId = path.split("/verify-payment/")[1];
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["line_items"], // to retrieve line_items details
        });

        return res.json({
          status: session.payment_status,
          paymentId: session.metadata?.paymentId,
          assignmentId: session.metadata?.assignmentId,
          amount: session.amount_total,
          // Use metadata first, or fallback to line_items
          assignmentTitle:
            session.metadata?.assignmentTitle ||
            session.line_items?.data[0]?.description ||
            "N/A",
          tutorName: session.metadata?.tutorName || "N/A",
        });
      } catch (error) {
        console.error("Error verifying payment:", error);
        return res.status(500).json({ error: error.message });
      }
    }

    return res.status(404).json({ error: "Not found" });
  });
});

// Scheduled function to send session reminders
// Runs every 2 hours to check for sessions happening in 24 hours
exports.sendSessionReminders = functions.pubsub
  .schedule('0 */2 * * *')
  .timeZone('Asia/Singapore')
  .onRun(async (context) => {
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(
        now.getTime() + 24 * 60 * 60 * 1000
      );
      const twentyThreeHoursFromNow = new Date(
        now.getTime() + 23 * 60 * 60 * 1000
      );

      console.log(
        `Checking for sessions between ${twentyThreeHoursFromNow.toISOString()} and ${twentyFourHoursFromNow.toISOString()}`
      );

      // Get all users
      const usersSnapshot = await admin.firestore().collection("users").get();
      const emailPromises = [];
      let sessionsFound = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const calendar = userData.calendar || [];

        // Check each session in the calendar array
        for (let i = 0; i < calendar.length; i++) {
          const session = calendar[i];

          // Skip if no start time or reminder already sent
          if (!session.start || session.reminderSent) {
            continue;
          }

          // Parse the session start time (ISO string format like "2025-10-27T12:00:00+08:00")
          const sessionTime = new Date(session.start);

          // Check if session is between 23-24 hours from now
          if (
            sessionTime >= twentyThreeHoursFromNow &&
            sessionTime <= twentyFourHoursFromNow
          ) {
            sessionsFound++;
            console.log(
              `Found upcoming session for user ${userDoc.id}: ${
                session.name
              } at ${sessionTime.toISOString()}`
            );

            // Send email to current user
            emailPromises.push(
              sendReminderEmail(
                userData.email,
                userData.name || "User",
                session,
                sessionTime,
                userData.role || "user"
              ).catch((err) =>
                console.error(`Failed to send email to ${userData.email}:`, err)
              )
            );

            // Mark reminder as sent by updating the specific session in the array
            const updatedCalendar = [...calendar];
            updatedCalendar[i] = { ...session, reminderSent: true };

            await admin.firestore().collection("users").doc(userDoc.id).update({
              calendar: updatedCalendar,
            });
          }
        }
      }

      await Promise.all(emailPromises);
      console.log(
        `Session reminder check complete. Found ${sessionsFound} sessions, sent ${emailPromises.length} emails.`
      );
      return null;
    } catch (error) {
      console.error("Error in sendSessionReminders:", error);
      return null;
    }
  });

// Helper function to send reminder email
async function sendReminderEmail(
  email,
  name,
  session,
  sessionDateTime,
  userRole
) {
  try {
    const formattedDate = sessionDateTime.toLocaleString("en-SG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Singapore",
    });

    const msg = {
      to: email,
      from: functions.config().sendgrid.sender_email,
      subject: "Reminder: Upcoming Tutoring Session Tomorrow",
      text: `Hi ${name},\n\nThis is a reminder that you have a tutoring session scheduled for:\n\nDate & Time: ${formattedDate}\nSession: ${
        session.name || "Tutoring Session"
      }\nDetails: ${
        session.details || "N/A"
      }\n\nPlease be prepared and on time.\n\nBest regards,\nTutorGuru Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📚 TutorGuru</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Upcoming Session Reminder</h2>
            <p style="color: #555; font-size: 16px;">Hi ${name},</p>
            <p style="color: #555; font-size: 16px;">This is a friendly reminder that you have a tutoring session scheduled for tomorrow:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <p style="margin: 8px 0; color: #333;"><strong>📅 Date & Time:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0; color: #333;"><strong>📖 Session:</strong> ${
                session.name || "Tutoring Session"
              }</p>
              ${
                session.details
                  ? `<p style="margin: 8px 0; color: #333;"><strong>📝 Details:</strong> ${session.details}</p>`
                  : ""
              }
              <p style="margin: 8px 0; color: #333;"><strong>👤 Your Role:</strong> ${
                userRole === "tutor" ? "Tutor" : "Parent/Student"
              }</p>
            </div>
            
            <p style="color: #555; font-size: 16px;">Please be prepared and on time for your session.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #888; font-size: 14px; margin: 5px 0;">Best regards,</p>
              <p style="color: #667eea; font-size: 16px; font-weight: bold; margin: 5px 0;">The TutorGuru Team</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>This is an automated reminder. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`Reminder email sent successfully to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    if (error.response) {
      console.error("SendGrid error details:", error.response.body);
    }
    throw error;
  }
}

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
