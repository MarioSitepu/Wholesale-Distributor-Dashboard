"use client";
import dynamic from "next/dynamic";

const HelpCenter = dynamic(() => import("../../../app-react/pages/admin/HelpCenter"), {
  ssr: false,
});

export default function Page() {
  return <HelpCenter />;
}

