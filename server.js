
require('dotenv').config();
const stripe = require("stripe")(process.env.API_KEY_SECRET);
const whendpointSecret = process.env.WHSEC;
const port =process.env.PORT;
const express = require("express");
const app = express();
const morgan = require('morgan')

// Use JSON parser for all non-webhook routes
app.use(
  (req,res,next) => {
    if (req.originalUrl === '/webhook') {
      next();
    } else {
      express.json()(req, res, next);
    }
  }
);

app.use(express.static("public"));
// app.use(express.json());
app.use(morgan('dev'))

const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 4433;
};

app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is 
    // optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});



app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {

  let event = request.body;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (whendpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers['stripe-signature'];

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        whendpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed: ${err.message}`);
      return response.sendStatus(400);
    }
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful david1!`);
      console.log(`PaymentIntent for ${paymentIntent.created} was successful david3!`);
      // console.log(`PaymentIntent for ${JSON.stringify(paymentIntent)} was successful david2!`);

      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});


app.listen(port, () => console.log(`Node server listening on port ${port}`));