"use client";

import { MessagesSquare, SendHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Role } from "@/generated/prisma/enums";
import {
  BOARD_MESSAGE_MAX_LENGTH,
  BOARD_MESSAGE_TTL_HOURS,
} from "@/lib/constants";
import { formatTime, getInitials } from "@/lib/format";
import {
  deleteBoardMessage,
  postBoardMessage,
} from "@/server/actions/community";

export type BoardMessageView = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: { name: string; role: Role };
};

const POLL_INTERVAL_MS = 15_000;

export function BoardPanel({
  initialMessages,
  currentUserId,
  canModerate,
}: {
  initialMessages: BoardMessageView[];
  currentUserId: string;
  canModerate: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastMessageId = useRef(initialMessages.at(-1)?.id ?? null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/board", { cache: "no-store" });

      if (!response.ok) return;

      const data: { messages: BoardMessageView[] } = await response.json();

      // Polling every few seconds would re-render the whole thread each time
      // and make it flicker, so identical payloads are dropped.
      setMessages((current) =>
        current.length === data.messages.length &&
        current.every((message, index) => message.id === data.messages[index].id)
          ? current
          : data.messages,
      );
    } catch {
      // A failed poll is not worth interrupting the user — the next one retries.
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const latestId = messages.at(-1)?.id ?? null;

    if (latestId === lastMessageId.current) return;

    lastMessageId.current = latestId;

    // Scrolling the panel itself, instead of `scrollIntoView`, keeps the page
    // from jumping when a new message lands.
    const viewport = viewportRef.current;

    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed) return;

    startTransition(async () => {
      const result = await postBoardMessage({ content: trimmed });

      if (!result.ok) {
        toast.error(result.message);

        return;
      }

      setContent("");
      await refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteBoardMessage({ id });

      if (!result.ok) {
        toast.error(result.message);

        return;
      }

      await refresh();
    });
  }

  return (
    <Card className="surface flex h-full flex-col rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessagesSquare className="size-4 text-muted-foreground" aria-hidden />
          Mural da turma
        </CardTitle>
        <CardDescription>
          As mensagens somem automaticamente depois de {BOARD_MESSAGE_TTL_HOURS}{" "}
          horas.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <ScrollArea className="h-64 pr-3" viewportRef={viewportRef}>
          {messages.length === 0 ? (
            <p className="flex h-64 items-center justify-center px-6 text-center text-xs text-balance text-muted-foreground">
              Ninguém escreveu nada ainda. Seja o primeiro!
            </p>
          ) : (
            <ul className="space-y-3">
              {messages.map((message) => {
                const isMine = message.userId === currentUserId;

                return (
                  <li key={message.id} className="enter-view flex items-start gap-2.5">
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                        {getInitials(message.user.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 rounded-xl rounded-tl-none border border-border bg-card px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium">
                          {message.user.name}
                        </span>
                        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                          {formatTime(message.createdAt)}
                        </span>
                        {isMine || canModerate ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Apagar mensagem"
                            disabled={isPending}
                            onClick={() => handleDelete(message.id)}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm break-words whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={BOARD_MESSAGE_MAX_LENGTH}
            placeholder="Escreva algo para a turma..."
            aria-label="Mensagem para o mural"
            className="h-10"
          />
          <Button
            type="submit"
            size="icon-lg"
            disabled={isPending || content.trim().length === 0}
            aria-label="Enviar mensagem"
          >
            <SendHorizontal aria-hidden />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
