import { Suspense } from "react";
import { FormCardSkeleton } from "@/components/site/skeletons";
import { ResetPasswordForm } from "@/components/site/reset-password-form";

export const metadata = { title: "Reset password — Alpha Mart" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function ResetPassword({ searchParams }: { searchParams: SearchParams }) {
  const { token, error } = await searchParams;
  const valid = typeof token === "string" && token.length > 0 && error === undefined;
  return <ResetPasswordForm token={valid ? token : null} />;
}

export default function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="bg-cream">
      <Suspense fallback={<FormCardSkeleton />}>
        <ResetPassword searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
