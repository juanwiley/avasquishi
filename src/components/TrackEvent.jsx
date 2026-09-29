"use client";
// Fires one analytics event when mounted (e.g. product_viewed on a product page).
import { useEffect } from "react";
import { track } from "@/lib/analytics";

export default function TrackEvent({ event, properties }) {
  const key = JSON.stringify(properties || {});
  useEffect(() => {
    track(event, JSON.parse(key));
  }, [event, key]);
  return null;
}
