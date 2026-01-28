import { Metadata } from "next";
import PerbandinganClient from "./perbandingan-client";

export const metadata: Metadata = {
    title: "Perbandingan Tahunan",
};

export default function PerbandinganPage() {
    return <PerbandinganClient />;
}
