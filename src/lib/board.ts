import { BOARD_MESSAGE_TTL_HOURS } from "@/lib/constants";

/** Oldest timestamp a board message may have before it is pruned. */
export function boardMessageCutoff() {
  return new Date(Date.now() - BOARD_MESSAGE_TTL_HOURS * 60 * 60 * 1000);
}
