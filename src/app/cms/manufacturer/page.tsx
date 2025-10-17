"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { api } from "~/trpc/react";
import Barcode from "react-barcode";

const manufacturerSchema = z.object({
  name: z.string().optional(),
  barcode: z.string().min(1, "Barcode is required"),
});

type ManufacturerFormData = z.infer<typeof manufacturerSchema>;

interface Manufacturer {
  id: string;
  name?: string;
  barcode: string;
  createdAt: Date;
}

export default function ManufacturersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: manufacturers = [],
    refetch,
    isLoading,
  } = api.manufacturer.getAll.useQuery();

  const createMutation = api.manufacturer.create.useMutation();
  const updateMutation = api.manufacturer.update.useMutation();
  const deleteMutation = api.manufacturer.delete.useMutation();

  const form = useForm<ManufacturerFormData>({
    resolver: zodResolver(manufacturerSchema),
    defaultValues: {
      name: "",
      barcode: "",
    },
  });

  useEffect(() => {
    if (editingManufacturer) {
      form.reset({
        name: editingManufacturer.name || "",
        barcode: editingManufacturer.barcode,
      });
    } else {
      form.reset({
        name: "",
        barcode: "",
      });
    }
  }, [editingManufacturer, form]);

  const filteredManufacturers = manufacturers.filter(
    (manufacturer) =>
      manufacturer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.barcode?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const onSubmit = async (data: ManufacturerFormData) => {
    setIsSubmitting(true);
    try {
      if (editingManufacturer) {
        await updateMutation.mutateAsync({
          id: editingManufacturer.id,
          ...data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      await refetch();
      setIsDialogOpen(false);
      setEditingManufacturer(null);
      form.reset();
    } catch (error) {
      console.error("Error saving manufacturer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this manufacturer?")) {
      await deleteMutation.mutateAsync({ id });
      await refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manufacturers</CardTitle>
              <CardDescription>Manage your manufacturers</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingManufacturer(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manufacturer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingManufacturer ? "Edit Manufacturer" : "Add New Manufacturer"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingManufacturer
                      ? "Update the manufacturer details below."
                      : "Fill in the details to add a new manufacturer."}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      {...form.register("name")}
                      placeholder="Enter manufacturer name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Barcode *</label>
                    <Input
                      {...form.register("barcode")}
                      placeholder="Enter barcode"
                    />
                    {form.formState.errors.barcode && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.barcode.message}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {editingManufacturer ? "Update" : "Create"} Manufacturer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search manufacturers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManufacturers.map((manufacturer) => (
                  <TableRow key={manufacturer.id}>
                    <TableCell>
                      {manufacturer.name === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {manufacturer.name}
                        </p>
                      ) : (
                        manufacturer.name
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col items-center">
                        <Barcode value={manufacturer.barcode as any} />
                        <span className="mt-1 text-xs">{manufacturer.barcode}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {manufacturer.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(manufacturer as any)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(manufacturer.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredManufacturers.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              {manufacturers.length === 0
                ? "No manufacturers found. Add your first manufacturer!"
                : "No manufacturers match your search."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}