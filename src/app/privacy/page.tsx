import { PolicyPage } from "@/components/site/policy-page";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Privacy policy — Alpha Mart" };

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy policy" updated="19 November 2026">
      <p>
        {BUSINESS.legalName} (&ldquo;we&rdquo;) runs Alpha Mart. This policy explains what personal data we collect when you browse, enquire or order, and how we use it.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Your <strong>name, phone number and delivery address</strong>, and your email if you sign in or give it to us.</li>
        <li>Your <strong>order history</strong>, including the items, amounts, coupon used and order status.</li>
        <li>The details you put in an enquiry or requirement form.</li>
      </ul>
      <h2>Why we use it</h2>
      <p>We use this data only to fulfil your orders: to confirm and ship them, contact you about delivery, handle returns, replacements and refunds, and answer your enquiries.</p>
      <h2>Payments</h2>
      <p>
        Orders are paid through PhonePe. Payment is handled on PhonePe&apos;s own pages, and <strong>we do not see or store your card, UPI PIN or netbanking details</strong>. We receive only the payment status and transaction reference needed to confirm your order.
      </p>
      <h2>Where it is stored</h2>
      <p>Account and order data is stored with Google Firebase. Access is limited to our staff who need it to serve you.</p>
      <h2>Sharing</h2>
      <p>
        We share your name, phone number and address with the courier delivering your order, and payment information with PhonePe. We do not sell your personal data.
      </p>
      <h2>Your choices</h2>
      <p>
        You can ask us to correct or delete your data by writing to {BUSINESS.email}. We may keep order records for as long as needed for accounting, tax and warranty obligations.
      </p>
      <h2>Contact</h2>
      <p>
        {BUSINESS.legalName}, {BUSINESS.address}. Email {BUSINESS.email}, phone {BUSINESS.phone}.
      </p>
    </PolicyPage>
  );
}
