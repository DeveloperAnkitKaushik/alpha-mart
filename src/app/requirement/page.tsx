import { RequirementForm } from "@/components/requirement/requirement-form";

export const metadata = { title: "Post a requirement — Alpha Mart" };

export default function RequirementPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 pb-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Post a requirement</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Tell us what you need once. Verified suppliers will send you quotes.
      </p>
      <RequirementForm />
    </div>
  );
}
