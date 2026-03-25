import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { BannerForm } from "~/features/consent/components/BannerForm";
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from "~/features/consent/api/banners";
import type { CookieBanner } from "~/features/consent/types/banner";

export default function CookieBannersPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<CookieBanner | null>(null);

    const { data: banners, isLoading } = useBanners();
    const createBanner = useCreateBanner();
    const updateBanner = useUpdateBanner();
    const deleteBanner = useDeleteBanner();

    const handleOpenCreate = () => {
        setEditingBanner(null);
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (banner: CookieBanner) => {
        setEditingBanner(banner);
        setIsSheetOpen(true);
    };

    const handleSubmit = (data: CookieBanner) => {
        if (editingBanner) {
            updateBanner.mutate(
                { id: editingBanner.id!, banner: data },
                {
                    onSuccess: () => {
                        setIsSheetOpen(false);
                        toast.success("Cookie banner updated successfully!");
                    },
                    onError: (err) => {
                        toast.error(err.message || "Failed to update cookie banner");
                    },
                }
            );
        } else {
            createBanner.mutate(data, {
                onSuccess: () => {
                    setIsSheetOpen(false);
                    toast.success("Cookie banner created successfully!");
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to create cookie banner");
                },
            });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this cookie banner?")) {
            deleteBanner.mutate(id, {
                onSuccess: () => {
                    toast.success("Cookie banner deleted successfully!");
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to delete cookie banner");
                },
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Cookie Banners</h2>
                    <p className="text-muted-foreground">
                        Configure and manage cookie consent banners for your domains.
                    </p>
                </div>

                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Banner
                </Button>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="overflow-y-auto sm:max-w-[1200px] w-[95vw] p-0 sm:p-6">
                        <div className="p-4 sm:p-0">
                            <SheetHeader className="mb-6 p-0 sm:p-0">
                                <SheetTitle>{editingBanner ? "Edit Cookie Banner" : "Create Cookie Banner"}</SheetTitle>
                                <SheetDescription>
                                    {editingBanner ? "Modify your cookie banner configuration." : "Add a new banner and configure its content and appearance."}
                                </SheetDescription>
                            </SheetHeader>
                            <BannerForm
                                key={editingBanner ? editingBanner.id : "new"}
                                initialData={editingBanner || undefined}
                                onSubmit={handleSubmit}
                                isLoading={createBanner.isPending || updateBanner.isPending}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Inner Name</TableHead>
                            <TableHead>Domain</TableHead>
                            <TableHead>Theme</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[60px] rounded-full" /></TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-8 w-16 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : banners?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No cookie banners found. Create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            banners?.map((banner) => (
                                <TableRow key={banner.id}>
                                    <TableCell className="font-medium">{banner.name}</TableCell>
                                    <TableCell>{banner.domain}</TableCell>
                                    <TableCell className="capitalize">{banner.theme || "light"}</TableCell>
                                    <TableCell className="capitalize">{(banner.position || "bottom").replace("-", " ")}</TableCell>
                                    <TableCell>
                                        {banner.active ? (
                                            <Badge variant="default">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEdit(banner)}
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(banner.id!)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
