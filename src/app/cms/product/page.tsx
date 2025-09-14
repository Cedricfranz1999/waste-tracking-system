"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
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
import { Plus, Edit, Trash2, Search, Loader2, Upload, X } from "lucide-react";
import { api } from "~/trpc/react";
import { uploadImage } from "~/lib/upload";

const productSchema = z.object({
  image: z.string().optional(),
  barcode: z.string().min(1, "Barcode is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  image?: string;
  barcode: string;
  manufacturer: string;
  description?: string;
  createdAt: Date;
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: products = [],
    refetch,
    isLoading,
  } = api.product.getAll.useQuery();
  const createMutation = api.product.create.useMutation();
  const updateMutation = api.product.update.useMutation();
  const deleteMutation = api.product.delete.useMutation();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      image: "",
      barcode: "",
      manufacturer: "",
      description: "",
    },
  });

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        image: editingProduct.image || "",
        barcode: editingProduct.barcode,
        manufacturer: editingProduct.manufacturer,
        description: editingProduct.description || "",
      });
      setImagePreview(editingProduct.image || "");
    } else {
      form.reset({
        image: "",
        barcode: "",
        manufacturer: "",
        description: "",
      });
      setImagePreview("");
      setSelectedFile(null);
    }
  }, [editingProduct, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    form.setValue("image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      // Upload image to Supabase if a new file is selected
      let imageUrl = data.image;
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          ...data,
          image: imageUrl,
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          image: imageUrl,
        });
      }

      await refetch();
      setIsDialogOpen(false);
      setEditingProduct(null);
      form.reset();
      setSelectedFile(null);
      setImagePreview("");
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
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
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage your product inventory</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingProduct(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct
                      ? "Update the product details below."
                      : "Fill in the details to add a new product."}
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Image Upload Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Image</label>

                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-32 rounded-md object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*"
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-4 hover:border-gray-400"
                        >
                          <Upload className="mb-2 h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Click to upload image
                          </span>
                          <span className="text-xs text-gray-400">
                            PNG, JPG, JPEG up to 10MB
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Hidden input for form validation */}
                    <Input type="hidden" {...form.register("image")} />
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Manufacturer *
                    </label>
                    <Input
                      {...form.register("manufacturer")}
                      placeholder="Enter manufacturer"
                    />
                    {form.formState.errors.manufacturer && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.manufacturer.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      {...form.register("description")}
                      placeholder="Enter product description"
                      rows={3}
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setSelectedFile(null);
                        setImagePreview("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {editingProduct ? "Update" : "Create"} Product
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
                placeholder="Search products..."
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
                  <TableHead>Image</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image && (
                        <img
                          src={product.image}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                    </TableCell>

                    {/* Barcode */}
                    <TableCell className="font-medium">
                      {product.barcode === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {product.barcode}
                        </p>
                      ) : (
                        product.barcode
                      )}
                    </TableCell>

                    {/* Manufacturer */}
                    <TableCell>
                      {product.manufacturer === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {product.manufacturer}
                        </p>
                      ) : (
                        product.manufacturer
                      )}
                    </TableCell>

                    {/* Description */}
                    <TableCell>
                      {product.description === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {product.description}
                        </p>
                      ) : (
                        product.description
                      )}
                    </TableCell>

                    {/* CreatedAt */}
                    <TableCell>
                      {product.createdAt.toLocaleDateString() ===
                      "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {product.createdAt.toLocaleDateString()}
                        </p>
                      ) : (
                        product.createdAt.toLocaleDateString()
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product as any)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
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

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              {products.length === 0
                ? "No products found. Add your first product!"
                : "No products match your search."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
