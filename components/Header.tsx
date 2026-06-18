"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-indigo-600 text-lg">
          <span>📚</span>
          <span>Kids Planner</span>
        </Link>

        {session?.user && (
          <div className="flex items-center gap-3">
            <Link
              href="/kids"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              My Kids
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  {(session.user.name ?? "U")[0].toUpperCase()}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
