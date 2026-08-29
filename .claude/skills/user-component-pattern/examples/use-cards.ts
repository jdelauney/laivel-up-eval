// React Query hook
"use client";
import { useQuery } from "@tanstack/react-query";
import { getCardsAction } from "../actions/get-cards.action";

export function useCards() {
  return useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const result = await getCardsAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
