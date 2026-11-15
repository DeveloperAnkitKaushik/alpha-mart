import { Suspense } from "react";
import { FormCardSkeleton } from "@/components/site/skeletons";
import { SignInView } from "@/components/site/signin-view";

export const metadata = { title: "Sign in — Alpha Mart" };

export default function SignInPage() {
  return (
    <div className="bg-cream">
      <Suspense fallback={<FormCardSkeleton />}>
        <SignInView />
      </Suspense>
    </div>
  );
}
