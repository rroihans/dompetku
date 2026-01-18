import { Metadata } from "next";
import ComparisonClient from "./comparison-client";

export const metadata: Metadata = {
  title: "Perbandingan Tahunan",
};

export default function ComparisonPage() {
  return <ComparisonClient />;
}
