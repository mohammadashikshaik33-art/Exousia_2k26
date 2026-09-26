import React from "react";
import HomeClientWrapper from "@/components/HomeClientWrapper";
import { getPublishedFestival, getPublishedEvents } from "@/lib/data";

export default async function Home() {
  const festival = await getPublishedFestival();
  const events = await getPublishedEvents();

  return (
    <HomeClientWrapper festival={festival} events={events} />
  );
}
