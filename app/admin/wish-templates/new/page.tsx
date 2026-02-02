"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { WishTemplateForm } from "@/components/wish-template-form";

export default function NewWishTemplatePage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/wish-templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">新建愿望模板</h1>
          <p className="text-muted-foreground">创建新的愿望模板</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <WishTemplateForm
          onSuccess={() => {
            router.push("/admin/wish-templates");
          }}
          onCancel={() => {
            router.push("/admin/wish-templates");
          }}
        />
      </div>
    </div>
  );
}
