import { auth, signIn } from "@/lib/auth";
import { getKids } from "@/lib/redis";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kids Class Planner</h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            Capture school messages from WhatsApp and automatically schedule tests,
            activities, and homework into Google Calendar — for each of your kids.
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-400">
            Calendar access is required to create events on your behalf.
          </p>
        </div>
      </main>
    );
  }

  const kids = await getKids(session.user.email);
  if (kids.length === 0) {
    redirect("/setup");
  }

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        <HomeClient kids={kids} />
      </main>
    </>
  );
}
