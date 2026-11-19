import { PolicyPage } from "@/components/site/policy-page";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Shipping and delivery policy — Alpha Mart" };

export default function ShippingPage() {
  return (
    <PolicyPage title="Shipping and delivery policy" updated="19 November 2026">
      <p>
        {BUSINESS.legalName} sells certified refurbished laptops and PCs and delivers across India. This page explains how and when your order reaches you.
      </p>
      <h2>Delivery charges</h2>
      <p>Delivery is free on every order. There are no shipping, handling or packaging fees added at checkout.</p>
      <h2>Dispatch and delivery time</h2>
      <ul>
        <li>Orders are shipped within <strong>1 to 3 business days</strong> of payment being confirmed.</li>
        <li>Business days are Monday to Saturday, excluding public holidays.</li>
        <li>Once the order ships, we share the courier name and tracking details on your order page and by phone or email.</li>
        <li>Transit time after dispatch depends on your pincode and the courier, and is usually a few days.</li>
      </ul>
      <h2>Packaging and inspection</h2>
      <p>
        Each device is tested, cleaned and packed in protective packaging before dispatch. Please check the box for visible damage when it arrives. If it looks damaged, take photos and contact us within 48 hours of delivery.
      </p>
      <h2>Delivery address</h2>
      <p>
        We deliver to the address you enter at checkout. Please make sure the name, phone number and pincode are correct. If a courier cannot reach you, we will contact you to arrange another attempt.
      </p>
      <h2>Cancelling before dispatch</h2>
      <p>You can cancel for free until the order ships. See the cancellation and refund policy for details.</p>
      <h2>Contact</h2>
      <p>
        Questions about a delivery: {BUSINESS.email} or {BUSINESS.phone}.
      </p>
    </PolicyPage>
  );
}
