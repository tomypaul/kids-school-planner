import { auth } from "@/lib/auth";
import { getKids, getPendingText } from "@/lib/redis";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import ReviewClient from "./ReviewClient";

interface SearchParams {
  token?: string;
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const kids = await getKids(session.user.email);
  if (kids.length === 0) redirect("/setup");

  const { token } = await searchParams;
  const pendingText = token ? ((await getPendingText(token)) ?? "") : "";

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        <ReviewClient kids={kids} pendingText={pendingText} pendingToken={token} />
      </main>
    </>
  );
}
