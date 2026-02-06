"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageWaterfall } from "@/components/image-waterfall";
import {
  SearchableSelect,
  type SelectOption,
} from "@/components/searchable-select";

interface Image {
  id: string;
  url: string;
  originalName: string;
  uploader: {
    name: string | null;
    phone: string | null;
  };
  owner: {
    type: string;
    id: string;
  };
  referenceCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FamilyOption {
  id: string;
  name: string;
  parentName?: string | null;
  parentPhone?: string | null;
  type: "family" | "admin" | "all";
}

export default function ImageBedPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [familyOptions, setFamilyOptions] = useState<FamilyOption[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (ownerFilter && ownerFilter !== "all") {
        if (ownerFilter === "admin") {
          params.append("owner", "admin");
        } else {
          params.append("owner", ownerFilter);
        }
      }

      const response = await fetch(`/api/image-bed?${params}`);
      const data = await response.json();

      if (data.success) {
        setImages(data.data.images);
        setPagination(data.data.pagination);
      } else {
        console.error("Failed to fetch images:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, ownerFilter, searchFilter]);

  const fetchFamilyOptions = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/families?status=approved");
      const data = await response.json();

      if (data.success && data.data) {
        const families = data.data;

        const familiesWithParents = families.map((f: any) => ({
          id: f.id,
          name: f.name,
          parentName: f.primaryParent?.name || null,
          parentPhone: f.primaryParent?.phone || null,
          type: "family" as const,
        }));

        const options: FamilyOption[] = [
          { id: "all", name: "全部", type: "all" },
          {
            id: "admin",
            name: "管理员",
            parentName: "admin",
            parentPhone: null,
            type: "admin",
          },
          ...familiesWithParents,
        ];

        setFamilyOptions(options);
      }
    } catch (error) {
      console.error("Failed to fetch family options:", error);
    }
  }, []);

  const filteredOptions = familyOptions.filter((option) => {
    if (!searchFilter) return true;
    const searchLower = searchFilter.toLowerCase();
    return (
      option.name.toLowerCase().includes(searchLower) ||
      option.parentName?.toLowerCase().includes(searchLower) ||
      option.parentPhone?.includes(searchFilter)
    );
  });

  useEffect(() => {
    fetchImages();
    fetchFamilyOptions();
  }, [ownerFilter, fetchFamilyOptions]);

  const handleFilterSelect = useCallback((value: string) => {
    setOwnerFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("确定要删除这张图片吗？")) return;

      try {
        const response = await fetch(`/api/image-bed/${id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
          fetchImages();
        } else {
          alert(data.error || "删除失败");
        }
      } catch (error) {
        alert("删除失败，请重试");
      }
    },
    [fetchImages],
  );

  const selectOptions: SelectOption[] = familyOptions.map((option) => ({
    id: option.id,
    label:
      option.type === "all"
        ? "全部"
        : option.type === "admin"
          ? "管理员(admin)"
          : `${option.name}(${option.parentName || "未知"})(${option.parentPhone || "未知"})`,
    data: option,
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">图床管理</h1>
          <p className="text-muted-foreground">管理所有上传的图片</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                上传图片
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {uploadError}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <SearchableSelect
          options={selectOptions}
          value={ownerFilter}
          onChange={handleFilterSelect}
          placeholder="筛选归属"
          searchPlaceholder="搜索家庭或家长..."
          emptyText="无匹配选项"
          width="320px"
        />
      </div>

      {/* Image count */}
      <div className="text-sm text-muted-foreground">
        共 {pagination.total} 张图片
      </div>

      {/* Image gallery */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ImageWaterfall
          images={images}
          onDelete={handleDelete}
          isAdmin={true}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={pagination.page === pagination.totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
