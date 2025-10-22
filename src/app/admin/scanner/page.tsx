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
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Upload,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "~/trpc/react";
import { uploadImage } from "~/lib/upload";

const scannerSchema = z.object({
  image: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  gender: z.string().min(1, "Gender is required"),
  birthdate: z.string().min(1, "Birthdate is required"),
});

type ScannerFormData = z.infer<typeof scannerSchema>;

interface Scanner {
  id: string;
  image?: string;
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  address: string;
  gender: string;
  birthdate: string;
  createdAt: Date;
}

export default function ScannersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScanner, setEditingScanner] = useState<Scanner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: scanners = [],
    refetch,
    isLoading,
  } = api.scanner.getAll.useQuery();
  const createMutation = api.scanner.create.useMutation();
  const updateMutation = api.scanner.update.useMutation();
  const deleteMutation = api.scanner.delete.useMutation();

  const form = useForm<ScannerFormData>({
    resolver: zodResolver(scannerSchema),
    defaultValues: {
      image: "",
      username: "",
      password: "",
      firstname: "",
      lastname: "",
      email: "",
      address: "",
      gender: "",
      birthdate: "",
    },
  });

  useEffect(() => {
    if (editingScanner) {
      form.reset({
        image: editingScanner.image || "",
        username: editingScanner.username,
        password: editingScanner.password,
        firstname: editingScanner.firstname,
        lastname: editingScanner.lastname,
        email: editingScanner.email,
        address: editingScanner.address,
        gender: editingScanner.gender,
        birthdate: editingScanner.birthdate,
      });
      setImagePreview(editingScanner.image || "");
    } else {
      form.reset({
        image: "",
        username: "",
        password: "",
        firstname: "",
        lastname: "",
        email: "",
        address: "",
        gender: "",
        birthdate: "",
      });
      setImagePreview("");
      setSelectedFile(null);
    }
  }, [editingScanner, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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

  const filteredScanners = scanners.filter(
    (scanner) =>
      scanner.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scanner.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scanner.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scanner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scanner.address?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const onSubmit = async (data: ScannerFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = data.image;
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }
      if (editingScanner) {
        await updateMutation.mutateAsync({
          id: editingScanner.id,
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
      setEditingScanner(null);
      form.reset();
      setSelectedFile(null);
      setImagePreview("");
    } catch (error) {
      console.error("Error saving scanner:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (scanner: Scanner) => {
    setEditingScanner(scanner);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this scanner?")) {
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
              <CardTitle>Scanners</CardTitle>
              <CardDescription>Manage your scanner accounts</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                {/* <Button onClick={() => setEditingScanner(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Scanner
                </Button> */}
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingScanner ? "Edit Scanner" : "Add New Scanner"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingScanner
                      ? "Update the scanner details below."
                      : "Fill in the details to add a new scanner."}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Profile Image</label>
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
                    <Input type="hidden" {...form.register("image")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username *</label>
                      <Input
                        {...form.register("username")}
                        placeholder="Enter username"
                      />
                      {form.formState.errors.username && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password *</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...form.register("password")}
                          placeholder="Enter password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {form.formState.errors.password && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        First Name *
                      </label>
                      <Input
                        {...form.register("firstname")}
                        placeholder="Enter first name"
                      />
                      {form.formState.errors.firstname && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.firstname.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Last Name *</label>
                      <Input
                        {...form.register("lastname")}
                        placeholder="Enter last name"
                      />
                      {form.formState.errors.lastname && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.lastname.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      {...form.register("email")}
                      placeholder="Enter email"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address *</label>
                    <Textarea
                      {...form.register("address")}
                      placeholder="Enter address"
                      rows={2}
                    />
                    {form.formState.errors.address && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Gender *</label>
                      <select
                        {...form.register("gender")}
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {form.formState.errors.gender && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.gender.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Birthdate *</label>
                      <Input type="date" {...form.register("birthdate")} />
                      {form.formState.errors.birthdate && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.birthdate.message}
                        </p>
                      )}
                    </div>
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
                      {editingScanner ? "Update" : "Create"} Scanner
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
                placeholder="Search scanners..."
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
                  <TableHead>Username</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Birthdate</TableHead>
                  <TableHead>Created</TableHead>
                  {/* <TableHead className="text-right">Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScanners.map((scanner) => (
                  <TableRow key={scanner.id}>
                    <TableCell>
                      {scanner.image && (
                        <img
                          src={scanner.image}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {scanner.username === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {scanner.username}
                        </p>
                      ) : (
                        scanner.username
                      )}
                    </TableCell>
                    <TableCell>
                      {scanner.firstname === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {scanner.firstname}
                        </p>
                      ) : (
                        scanner.firstname
                      )}
                    </TableCell>
                    <TableCell>
                      {scanner.lastname === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {scanner.lastname}
                        </p>
                      ) : (
                        scanner.lastname
                      )}
                    </TableCell>
                    <TableCell>
                      {scanner.email === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {scanner.email}
                        </p>
                      ) : (
                        scanner.email
                      )}
                    </TableCell>
                    <TableCell>
                      {scanner.address === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {scanner.address}
                        </p>
                      ) : (
                        scanner.address
                      )}
                    </TableCell>
                    <TableCell>
                      {scanner.gender === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {scanner.gender}
                        </p>
                      ) : (
                        scanner.gender
                      )}
                    </TableCell>
                    <TableCell>
                      {scanner.birthdate === "Edited Data" ? (
                        <p className="shadow-2x w-32 truncate rounded-2xl border border-red-300 bg-white px-2 py-1 text-center text-red-500 drop-shadow-2xl">
                          {scanner.birthdate}
                        </p>
                      ) : (
                        scanner.birthdate
                      )}
                    </TableCell>
                    <TableCell>
                      {scanner.createdAt.toLocaleDateString()}
                    </TableCell>
                    {/* <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(scanner as any)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(scanner.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredScanners.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              {scanners.length === 0
                ? "No scanners found. Add your first scanner!"
                : "No scanners match your search."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
