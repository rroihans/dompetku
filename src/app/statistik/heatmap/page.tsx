import { Metadata } from "next";
import HeatmapClient from "./heatmap-client";

export const metadata: Metadata = {
  title: "Spending Heatmap",
};

export default function HeatmapPage() {
  return <HeatmapClient />;
}
