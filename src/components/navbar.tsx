import { Captions } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="flex w-full items-center p-3 justify-between sticky top-0 backdrop-blur-sm">
      <Link
        href={"/"}
        className="flex items-center text-2xl font-semibold tracking-tighter"
      >
        Subtitle <Captions className="size-8 ml-1" />
      </Link>
     
    </div>
  );
}
