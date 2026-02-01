"use client";

import { useState } from "react";
import { DateStrategyList } from "@/components/date-strategy-list";
import { DateStrategyModal } from "@/components/date-strategy-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";

export function DateStrategySection() {
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <Card className="bg-white border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Calendar className="h-5 w-5" />
              日期策略模板
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">管理日期策略模板</p>
          </div>
          <Button size="sm" className="flex items-center gap-1" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            创建
          </Button>
        </CardHeader>
        <CardContent>
          <DateStrategyList key={refreshKey} />
        </CardContent>
      </Card>

      <DateStrategyModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={handleSuccess}
      />
    </>
  );
}
