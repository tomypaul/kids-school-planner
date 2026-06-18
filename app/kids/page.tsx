import { auth } from "@/lib/auth";
import { getKids } from "@/lib/redis";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import KidsClient from "./KidsClient";

export default async function KidsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const kids = await getKids(session.user.email);

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        <KidsClient initialKids={kids} />
      </main>
    </>
  );
}
