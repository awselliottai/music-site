import album from "@/data/album.json";
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect(`/${album.slug}`);
}
