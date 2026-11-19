import { PolicyPage } from "@/components/site/policy-page";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Cancellation, refund and replacement policy — Alpha Mart" };

export default function RefundsPage() {
  return (
    <PolicyPage title="Cancellation, refund and replacement policy" updated="19 November 2026">
      <p>This policy applies to all purchases made from {BUSINESS.legalName}. All payments are prepaid through PhonePe.</p>
      <h2>Cancelling an order</h2>
      <ul>
        <li>You can cancel an order <strong>free of charge until it ships</strong>.</li>
        <li>To cancel, contact us at {BUSINESS.email} or {BUSINESS.phone} with your order number.</li>
        <li>Once an order has shipped it can no longer be cancelled, but you can still return it under the replacement terms below.</li>
        <li>A cancelled order is refunded in full to the original payment method.</li>
      </ul>
      <h2>Replacement within 15 days</h2>
      <p>
        If the device you receive is faulty, not as described or damaged in transit, tell us within <strong>15 days of delivery</strong>. We will arrange a pickup and send you a replacement. If we cannot replace it, we will refund you.
      </p>
      <h2>Warranty</h2>
      <p>
        Every device comes with a <strong>6 month warranty</strong> covering hardware faults that are not caused by physical damage, liquid damage or unauthorised repair. Contact us with your order number and we will repair or replace the device.
      </p>
      <h2>Refunds</h2>
      <ul>
        <li>Refunds go to the <strong>original payment method</strong> (the UPI account, card or bank account used on PhonePe).</li>
        <li>The refund is processed within <strong>5 to 7 business days</strong> after we approve the return.</li>
        <li>A return is approved after we receive the device and confirm its condition.</li>
        <li>We do not issue refunds in cash or to a different account.</li>
      </ul>
      <h2>Failed payments</h2>
      <p>
        If money was debited but the order was not confirmed, the amount is returned to your account by PhonePe and your bank, normally within a few business days. Contact us if it has not arrived.
      </p>
      <h2>Contact</h2>
      <p>
        {BUSINESS.legalName}, {BUSINESS.address}. Email {BUSINESS.email}, phone {BUSINESS.phone}.
      </p>
    </PolicyPage>
  );
}
