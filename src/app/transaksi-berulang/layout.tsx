import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Transaksi Berulang",
    description: "Kelola automasi transaksi dan biaya admin",
};

export default function TransaksiBerulangLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
