import { useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function useStoreUser() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const [userId, setUserId] = useState(null);

  const storeUser = useMutation(api.users.store);

  // normalize dependency to avoid "size changed" error
  const clerkUserId = user?.id ?? null;

  useEffect(() => {
    if (!isAuthenticated || userId) return;

    async function createUser() {
      try {
        const id = await storeUser(); // Convex mutation should return user._id
        if (id) {
          setUserId(id);
        }
      } catch (error) {
        console.error("Failed to store user:", error);
      }
    }

    createUser();
  }, [isAuthenticated, storeUser, clerkUserId, userId]);

  return {
    isLoading: authLoading || (isAuthenticated && !userId),
    isAuthenticated: isAuthenticated && !!userId,
    userId,
  };
}
