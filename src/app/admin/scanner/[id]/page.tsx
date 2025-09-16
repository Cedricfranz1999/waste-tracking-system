"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Loader2,
  Save,
  X,
  Edit,
  MoreHorizontal,
  Trash2,
  QrCode,
  Plus,
  Upload,
  ImageIcon,
} from "lucide-react";

interface Scanner {
  id?: string;
  image?: string;
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  address: string;
  gender: string;
  birthdate: string;
  createdAt?: string;
}

// Base64 encoding/decoding utilities
const encodeToBase64 = (data: string): string => {
  return btoa(unescape(encodeURIComponent(data)));
};
const decodeFromBase64 = (encoded: string): string => {
  return decodeURIComponent(escape(atob(encoded)));
};
const encodeObjectToBase64 = (obj: any): any => {
  const encoded: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value && key !== "image") {
      encoded[key] = encodeToBase64(value);
    } else {
      encoded[key] = value;
    }
  }
  return encoded;
};
const decodeObjectFromBase64 = (obj: any): any => {
  const decoded: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value && key !== "image") {
      try {
        decoded[key] = decodeFromBase64(value);
      } catch {
        decoded[key] = value;
      }
    } else {
      decoded[key] = value;
    }
  }
  return decoded;
};

// Function to generate random string with all keyboard characters
const generateRandomPath = (length: number = 100): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Retry function for fetch
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries: number = 3,
  delay: number = 1000,
): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res;
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay);
  }
};

export default function Page() {
  const [randomPath, setRandomPath] = useState<string>("");
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [editingScanner, setEditingScanner] = useState<Scanner | null>(null);
  const [deletingScanner, setDeletingScanner] = useState<Scanner | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<Omit<Scanner, "id" | "createdAt">>({
    username: "",
    password: "",
    firstname: "",
    lastname: "",
    address: "",
    gender: "",
    birthdate: "",
    image: "",
  });

  // Generate or retrieve random path on component mount
  useEffect(() => {
    const storedPath = localStorage.getItem("scannerPath");
    if (storedPath) {
      setRandomPath(storedPath);
    } else {
      const path = generateRandomPath();
      localStorage.setItem("scannerPath", path);
      setRandomPath(path);
    }
  }, []);

  const fetchScanners = async () => {
    if (!randomPath) return;
    try {
      setIsLoadingPage(true);
      const res = await fetchWithRetry(`/api/encrypt/${randomPath}`, {
        method: "GET",
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const decodedScanners = data.map((scanner: any) =>
          decodeObjectFromBase64(scanner),
        );
        setScanners(decodedScanners);
      } else {
        setScanners([]);
      }
    } catch (error) {
      console.error("Fetch error after retries:", error);
      setScanners([]);
    } finally {
      setIsLoadingPage(false);
      setFetchAttempted(true);
    }
  };

  useEffect(() => {
    if (randomPath) {
      fetchScanners();
    }
  }, [randomPath]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({ ...prev, image: base64 }));
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert("Error reading file");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const encodedFormData = encodeObjectToBase64(formData);
      const encodedPath = encodeURIComponent(randomPath);
      const url = editingScanner?.id
        ? `/api/encrypt/${encodedPath}?id=${editingScanner.id}`
        : `/api/encrypt/${encodedPath}`;
      const method = editingScanner?.id ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(encodedFormData),
      });
      if (response.ok) {
        setFormData({
          username: "",
          password: "",
          firstname: "",
          lastname: "",
          address: "",
          gender: "",
          birthdate: "",
          image: "",
        });
        setEditingScanner(null);
        setIsFormDialogOpen(false);
        await fetchScanners();
      } else {
        console.error("Failed to save scanner");
        alert("Failed to save scanner. Please try again.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("An error occurred while saving. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingScanner?.id) return;
    try {
      const encodedPath = encodeURIComponent(randomPath);
      const response = await fetch(
        `/api/encrypt/${encodedPath}?id=${deletingScanner.id}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        await fetchScanners();
        setIsDeleteDialogOpen(false);
        setDeletingScanner(null);
      } else {
        console.error("Failed to delete scanner");
        alert("Failed to delete scanner. Please try again.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting. Please try again.");
    }
  };

  const handleAddNew = () => {
    setEditingScanner(null);
    setFormData({
      username: "",
      password: "",
      firstname: "",
      lastname: "",
      address: "",
      gender: "",
      birthdate: "",
      image: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsFormDialogOpen(true);
  };

  const handleEdit = (scanner: Scanner) => {
    setEditingScanner(scanner);
    setFormData({
      username: scanner.username,
      password: scanner.password,
      firstname: scanner.firstname,
      lastname: scanner.lastname,
      address: scanner.address,
      gender: scanner.gender,
      birthdate: scanner.birthdate,
      image: scanner.image || "",
    });
    setIsFormDialogOpen(true);
  };

  const handleCancel = () => {
    setEditingScanner(null);
    setFormData({
      username: "",
      password: "",
      firstname: "",
      lastname: "",
      address: "",
      gender: "",
      birthdate: "",
      image: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsFormDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegeneratePath = () => {
    const newPath = generateRandomPath();
    localStorage.setItem("scannerPath", newPath);
    setRandomPath(newPath);
  };

  if (isLoadingPage || !randomPath) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="ml-2">Loading scanners...</span>
      </div>
    );
  }

  if (fetchAttempted && scanners.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-teal-800">
              Scanner Management
            </h1>
          </div>
          <div className="flex space-x-2">
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleAddNew}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Scanner
            </Button>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="py-12 text-center text-gray-500">
            <QrCode className="mx-auto mb-4 h-12 w-12" />
            <p>No scanners found. Add your first scanner to get started.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-teal-800">
            Scanner Management
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={handleAddNew}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Scanner
          </Button>
        </div>
      </div>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Scanner List</h2>
        {scanners.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Birthdate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scanners.map((scanner) => (
                <TableRow key={scanner.id}>
                  <TableCell>
                    {scanner.image ? (
                      <img
                        src={scanner.image}
                        alt={`${scanner.firstname} ${scanner.lastname}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                        <ImageIcon className="h-5 w-5 text-teal-600" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {scanner.firstname} {scanner.lastname}
                  </TableCell>
                  <TableCell>{scanner.username}</TableCell>
                  <TableCell>{scanner.address}</TableCell>
                  <TableCell className="capitalize">{scanner.gender}</TableCell>
                  <TableCell>
                    {new Date(scanner.birthdate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(scanner)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeletingScanner(scanner);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <QrCode className="mx-auto mb-4 h-12 w-12" />
            <p>No scanners found. Add your first scanner to get started.</p>
          </div>
        )}
      </div>
      {/* Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScanner ? "Edit Scanner" : "Add New Scanner"}
            </DialogTitle>
            <DialogDescription>
              {editingScanner
                ? "Update the scanner information below."
                : "Fill in the details to add a new scanner."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="image">Profile Image</Label>
              <div className="flex flex-col items-center space-y-3">
                {formData.image ? (
                  <div className="relative">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="h-32 w-32 rounded-full border-2 border-teal-200 object-cover"
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
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-teal-300">
                    <ImageIcon className="h-8 w-8 text-teal-400" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {formData.image ? "Change Image" : "Upload Image"}
                </Button>
                <p className="text-center text-xs text-gray-500">
                  JPG, PNG or GIF (Max 2MB)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthdate">Birthdate</Label>
                <Input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {editingScanner ? "Update" : "Create"} Scanner
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              scanner
              {deletingScanner?.firstname} {deletingScanner?.lastname}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
