import paypal from "@paypal/checkout-server-sdk";

function payPalClient() {
  const env =
    process.env.PAYPAL_ENV === "live"
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_SECRET
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_SECRET
        );

  return new paypal.core.PayPalHttpClient(env);
}

export async function POST(req) {
  try {
    const client = payPalClient();
    const { amount } = await req.json(); // frontend se amount ayega

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: amount,
          },
        },
      ],
    });

    const response = await client.execute(request);
    return Response.json({ id: response.result.id });
  } catch (error) {
    console.log("PayPal Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
