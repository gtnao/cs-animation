"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { useReadStatus } from "@/hooks/use-read-status";

const TAB_CLASS_ACTIVE = "border-[#2D4855] text-[#2D4855]";
const TAB_CLASS_INACTIVE =
  "border-transparent text-muted-foreground hover:text-foreground";

export function AlgorithmLayout({
  children,
  title,
  slug,
  basePath,
}: {
  children: React.ReactNode;
  title: string;
  slug: string;
  basePath: string;
}) {
  const pathname = usePathname();
  const isAnimation = pathname.endsWith("/animation");
  const isRelated = pathname.endsWith("/related");
  const isArticle = !isAnimation && !isRelated;
  const { readMap, toggleRead, isLoaded } = useReadStatus();
  const isRead = isLoaded && !!readMap[slug];

  const tabClass = (active: boolean) =>
    `px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
      active ? TAB_CLASS_ACTIVE : TAB_CLASS_INACTIVE
    }`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="bg-[#2D4855]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            &larr; トップへ戻る
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-xl font-bold text-white">{title}</h1>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-white/70">読了</span>
              <Checkbox
                checked={isRead}
                onCheckedChange={() => toggleRead(slug)}
                className="border-white/50 data-checked:bg-white data-checked:border-white data-checked:text-[#2D4855]"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            <Link href={basePath} className={tabClass(isArticle)}>
              解説
            </Link>
            <Link
              href={`${basePath}/animation`}
              className={tabClass(isAnimation)}
            >
              アニメーション
            </Link>
            <Link
              href={`${basePath}/related`}
              className={tabClass(isRelated)}
            >
              関連
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
