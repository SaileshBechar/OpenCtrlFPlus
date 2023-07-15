import { Stripe as StripeServer } from "stripe";
import { createServerAction$, redirect } from "solid-start/server";
import config from "~/config";

interface Props {
  userID: string;
  email: string;
}

type LineItem = {
  price: string;
  quantity ?: number;
};

async function createCheckoutSession(formData: FormData, isUsage: boolean) {
  const stripe = new StripeServer(
    import.meta.env.VITE_STRIPE_SECRET_KEY,
    undefined as any
  );
  const prices : LineItem[]= [
    {
      price: (
        await stripe.prices.list({
          lookup_keys: [formData.get("base_lookup_key") as string],
          expand: ["data.product"],
        })
      ).data[0].id,
      quantity: 1,
    },
  ];
  if (isUsage) {
    const usage_price = (
      await stripe.prices.list({
        lookup_keys: [formData.get("usage_lookup_key") as string],
        expand: ["data.product"],
      })
    ).data[0].id;
    prices.push({ price: usage_price });
  }

  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    line_items: prices,
    mode: "subscription",
    success_url: `${config.CLIENT_BASE_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.CLIENT_BASE_URL}/pricing?canceled=true`,
    customer_email: formData.get("customer_email") as string,
    client_reference_id: formData.get("client_reference_id") as string,
  });
  console.log(session.url);
  return redirect(session.url as string);
}

export default function SubscriptionDisplay(props: Props) {
  const [checkoutBasic, { Form: FormBasic }] = createServerAction$(
    async (formData: FormData) => {
      return createCheckoutSession(formData, false);
    }
  );

  const [checkoutInfinite, { Form: FormInfinite }] = createServerAction$(
    async (formData: FormData) => {
      return createCheckoutSession(formData, true);
    }
  );

  return (
    <div class="overflow-x-auto">
      <table class="table w-full sm:text-xl">
        <thead>
          <tr>
            <th class=""></th>
            <th class="">
              <h2 class="text-3xl font-bold">Basic</h2>
            </th>
            <th class="">
              <h2 class="text-3xl font-bold flex items-center">
                Infinite
                <div class="badge badge-secondary text-xs ml-2">
                  RECOMMENDED
                </div>
              </h2>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th class=" font-semibold">Price</th>
            <td class="">
              <b>$9.99</b> USD per month
            </td>
            <td class="">
              <b>$14.99</b> USD per month
            </td>
          </tr>
          <tr>
            <th class=" font-semibold">Unlimited Searching</th>
            <td class="">
              <span class="checkmark">&#x2714;</span>
            </td>
            <td class="">
              <span class="checkmark">&#x2714;</span>
            </td>
          </tr>
          <tr>
            <th class=" font-semibold">New Pages per Month</th>
            <td class="font-bold">250</td>
            <td class="font-bold">800</td>
          </tr>
          <tr>
            <th class=" font-semibold">Extra Pages</th>
            <td class="">❌</td>
            <td class="">$0.07 USD per additional page</td>
          </tr>
          <tr>
            <th class=" font-semibold">Chat Engine</th>
            <td class="">GPT-3.5</td>
            <td class="">GPT-4</td>
          </tr>
          <tr>
            <th class=" font-semibold">Email Support</th>
            <td class="">
              <span class="checkmark">&#x2714;</span>
            </td>
            <td class="">
              <span class="checkmark">&#x2714;</span>
            </td>
          </tr>
          <tr>
            <th class=" font-semibold">Money Back Guarantee</th>
            <td class="">30-day</td>
            <td class="">30-day</td>
          </tr>
          <tr>
            <th class=""></th>
            <td class="">
              <FormBasic>
                <input
                  type="hidden"
                  name="base_lookup_key"
                  value="basic_monthly_subscription"
                />
                <input
                  type="hidden"
                  name="client_reference_id"
                  value={props.userID}
                />
                <input
                  type="hidden"
                  name="customer_email"
                  value={props.email}
                />
                <button
                  class="btn btn-primary w-56"
                  classList={{ loading: checkoutBasic.pending }}
                >
                  Subscribe
                </button>
              </FormBasic>
            </td>
            <td class="">
              <FormInfinite>
                <input
                  type="hidden"
                  name="base_lookup_key"
                  value="infinite_monthly_subscription"
                />
                <input
                  type="hidden"
                  name="usage_lookup_key"
                  value="infinite_monthly_usage"
                />
                <input
                  type="hidden"
                  name="client_reference_id"
                  value={props.userID}
                />
                <input
                  type="hidden"
                  name="customer_email"
                  value={props.email}
                />
                <button
                  class="btn btn-primary w-56"
                  classList={{ loading: checkoutInfinite.pending }}
                >
                  Subscribe
                </button>
              </FormInfinite>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
