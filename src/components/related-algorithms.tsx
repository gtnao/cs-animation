import Link from "next/link";
import { ALGORITHMS } from "@/data/algorithms";
import { RELATIONS } from "@/data/relations";

const algorithmMap = new Map(ALGORITHMS.map((a) => [a.slug, a]));

export function RelatedAlgorithms({ slug }: { slug: string }) {
  const relatedSlugs = RELATIONS[slug] || [];
  const related = relatedSlugs
    .map((s) => algorithmMap.get(s))
    .filter((a) => a != null);

  if (related.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        関連アルゴリズムはまだ登録されていません
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {related.map((alg) => (
        <Link
          key={alg.slug}
          href={`/${alg.slug}`}
          className="block p-4 border border-border rounded-lg hover:border-[#2D4855]/40 hover:shadow-sm transition-all"
        >
          <h3 className="font-semibold text-sm">{alg.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {alg.description}
          </p>
        </Link>
      ))}
    </div>
  );
}
