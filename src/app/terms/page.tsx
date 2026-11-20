import { PolicyPage } from "@/components/site/policy-page";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Terms and conditions — Alpha Mart" };

export default function TermsPage() {
  return (
    <PolicyPage title="Terms and conditions" updated="19 November 2026">
      <p>
        These terms apply to your use of Alpha Mart and to purchases from {BUSINESS.legalName}, {BUSINESS.address}. GSTIN: {BUSINESS.gstin}.
      </p>
      <h2>Products</h2>
      <p>
        We sell certified refurbished laptops and PCs. Each device is tested before sale and described with its grade, specifications and photos. Stock is limited, and an order is confirmed only after payment succeeds.
      </p>
      <h2>Prices and payment</h2>
      <ul>
        <li>Prices are in Indian rupees. Delivery is free.</li>
        <li>Payment is <strong>prepaid only</strong>, through PhonePe using UPI, cards or netbanking. We do not offer cash on delivery.</li>
        <li>We recompute the price when you place the order, so the amount you pay is the amount shown at checkout.</li>
        <li>Coupons are valid as stated and cannot be combined unless the coupon says so.</li>
      </ul>
      <h2>Delivery, cancellation and returns</h2>
      <p>
        Orders ship within 1 to 3 business days. You can cancel free until the order ships. If a device is faulty you can request a replacement within 15 days of delivery, and refunds go to the original payment method within 5 to 7 business days after an approved return. Every device carries a 6 month warranty. Please read the shipping and refund policies for the full terms.
      </p>
      <h2>Your account</h2>
      <p>Keep your sign-in details to yourself and give us accurate information. We may cancel an order that we reasonably believe is fraudulent, and refund it in full.</p>
      <h2>Liability</h2>
      <p>
        To the extent the law allows, our liability for any order is limited to the amount you paid for it. Nothing here limits your rights under Indian consumer law.
      </p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India, and the courts of India have jurisdiction over any dispute.</p>
      <h2>Contact</h2>
      <p>
        Email {BUSINESS.email} or call {BUSINESS.phone}.
      </p>
    </PolicyPage>
  );
}
