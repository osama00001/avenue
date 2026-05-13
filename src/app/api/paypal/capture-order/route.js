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
    const { orderID } = await req.json();

    const client = payPalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const response = await client.execute(request);

    return Response.json({ status: "COMPLETED", details: response.result });
  } catch (error) {
    console.log("Capture Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
