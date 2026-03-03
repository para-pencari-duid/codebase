import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PosCustomer } from "@/lib/types/pos-checkout";

interface UsePosCustomerResult {
  customerOpen: boolean;
  setCustomerOpen: (value: boolean) => void;
  customerQuery: string;
  setCustomerQuery: (value: string) => void;
  customers: PosCustomer[];
  selectedCustomer: PosCustomer | null;
  setSelectedCustomer: (customer: PosCustomer | null) => void;
  searchLoading: boolean;
  showAddNew: boolean;
  setShowAddNew: (value: boolean) => void;
  newCustomerName: string;
  setNewCustomerName: (value: string) => void;
  newCustomerPhone: string;
  setNewCustomerPhone: (value: string) => void;
  newCustomerAddress: string;
  setNewCustomerAddress: (value: string) => void;
  addNewLoading: boolean;
  handleAddNewCustomer: () => Promise<void>;
  resetCustomerState: () => void;
}

export function usePosCustomer(): UsePosCustomerResult {
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [addNewLoading, setAddNewLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerQuery.trim().length >= 2) {
        void searchCustomers(customerQuery);
      } else {
        setCustomers([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerQuery]);

  const searchCustomers = async (query: string) => {
    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/customers?search=${encodeURIComponent(query)}`,
      );
      if (!res.ok) {
        setCustomers([]);
        return;
      }
      const data: unknown = await res.json();
      setCustomers(
        Array.isArray(data) ? (data.slice(0, 20) as PosCustomer[]) : [],
      );
    } catch {
      setCustomers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      toast.error("Nama dan nomor HP wajib diisi");
      return;
    }

    setAddNewLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim(),
          address: newCustomerAddress.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("ADD_CUSTOMER_FAILED");

      const newCustomer = (await res.json()) as PosCustomer;
      setSelectedCustomer(newCustomer);
      setShowAddNew(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerAddress("");
      setCustomerOpen(false);
      toast.success(`Pelanggan "${newCustomer.name}" berhasil ditambahkan`);
    } catch {
      toast.error("Gagal menambahkan pelanggan");
    } finally {
      setAddNewLoading(false);
    }
  };

  const resetCustomerState = () => {
    setCustomerOpen(false);
    setCustomerQuery("");
    setCustomers([]);
    setSelectedCustomer(null);
    setShowAddNew(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
    setAddNewLoading(false);
  };

  return {
    customerOpen,
    setCustomerOpen,
    customerQuery,
    setCustomerQuery,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    searchLoading,
    showAddNew,
    setShowAddNew,
    newCustomerName,
    setNewCustomerName,
    newCustomerPhone,
    setNewCustomerPhone,
    newCustomerAddress,
    setNewCustomerAddress,
    addNewLoading,
    handleAddNewCustomer,
    resetCustomerState,
  };
}
