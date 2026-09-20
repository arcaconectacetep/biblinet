import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/current-user";
import { getBoardMessages } from "@/server/queries/library";

export const dynamic = "force-dynamic";

/** Polled by the board panel so new messages appear without a page reload. */
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const messages = await getBoardMessages();

  return NextResponse.json(
    {
      messages: messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
