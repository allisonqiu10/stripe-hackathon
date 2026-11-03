// OWNER: P4
import Link from "next/link";
import type { Cause } from "@/lib/contract";
import { formatCents } from "./format";
import { Card } from "./ui";

export function CauseCard({ cause }: { cause: Cause }) {
  return (
    <Link href={`/causes/${cause.slug}`} className="block">
      <Card className="transition hover:border-indigo-300">
        <p className="font-semibold text-slate-900">{cause.title}</p>
        <p className="text-sm text-slate-500">{cause.city}</p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-700">{cause.description}</p>
        <p className="mt-2 text-xs text-slate-500">Goal {formatCents(cause.goalCents)}</p>
      </Card>
    </Link>
  );
}
