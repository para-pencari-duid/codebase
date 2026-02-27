import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  CheckCircle,
  ChevronsUpDown,
  Gift,
  Loader2,
  Phone,
  Search,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PosCustomer, PosLoyaltyInfo } from "@/lib/types/pos-checkout";

interface CustomerLoyaltySectionProps {
  customerOpen: boolean;
  setCustomerOpen: (value: boolean) => void;
  customerQuery: string;
  setCustomerQuery: (value: string) => void;
  customers: PosCustomer[];
  selectedCustomer: PosCustomer | null;
  setSelectedCustomer: (value: PosCustomer | null) => void;
  searchLoading: boolean;
  showAddNew: boolean;
  setShowAddNew: (value: boolean) => void;
  newCustomerName: string;
  setNewCustomerName: (value: string) => void;
  newCustomerPhone: string;
  setNewCustomerPhone: (value: string) => void;
  addNewLoading: boolean;
  onAddNewCustomer: () => Promise<void>;
  loyaltyInfo: PosLoyaltyInfo | null;
  usePoints: boolean;
  setUsePoints: (value: boolean) => void;
  pointsToRedeem: number;
  setPointsToRedeem: (value: number) => void;
  subtotal: number;
  tax: number;
  calculatedDiscount: number;
}

export function CustomerLoyaltySection({
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
  addNewLoading,
  onAddNewCustomer,
  loyaltyInfo,
  usePoints,
  setUsePoints,
  pointsToRedeem,
  setPointsToRedeem,
  subtotal,
  tax,
  calculatedDiscount,
}: CustomerLoyaltySectionProps) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-red-500" />
          <Label className="font-semibold">Pilih Pelanggan *</Label>
          <Badge variant="destructive" className="text-[10px]">
            Wajib
          </Badge>
        </div>

        {!selectedCustomer && !showAddNew && (
          <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerOpen}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  Cari nama atau nomor HP...
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Ketik nama atau nomor HP..."
                  value={customerQuery}
                  onValueChange={setCustomerQuery}
                />
                <CommandList>
                  {searchLoading ? (
                    <div className="py-6 text-center text-sm">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : customers.length === 0 && customerQuery.length >= 2 ? (
                    <CommandEmpty>Pelanggan tidak ditemukan</CommandEmpty>
                  ) : null}

                  {customers.length > 0 && (
                    <CommandGroup heading="Pelanggan Terdaftar">
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.id}
                          onSelect={() => {
                            setSelectedCustomer(customer);
                            setCustomerOpen(false);
                          }}
                        >
                          <User className="mr-2 h-4 w-4" />
                          <div className="flex-1">
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {customer.phone || "No phone"}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {customerQuery.trim().length >= 2 && (
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setShowAddNew(true);
                          setNewCustomerName(customerQuery);
                          setCustomerOpen(false);
                        }}
                        className="text-primary"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Tambah pelanggan baru {customerQuery}
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {selectedCustomer && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-900">
                {selectedCustomer.name}
              </p>
              <p className="text-xs text-green-700">{selectedCustomer.phone}</p>
              {loyaltyInfo?.enabled && loyaltyInfo.points > 0 && (
                <p className="text-xs text-green-700 font-semibold mt-0.5">
                  <Gift className="inline h-3 w-3 mr-1" />
                  {loyaltyInfo.points.toLocaleString("id-ID")} poin (={" "}
                  {formatCurrency(loyaltyInfo.points * loyaltyInfo.pointValue)})
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-700 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                setSelectedCustomer(null);
                setUsePoints(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {showAddNew && (
          <div className="space-y-3 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <Label className="font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Tambah Pelanggan Baru
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddNew(false);
                  setNewCustomerName("");
                  setNewCustomerPhone("");
                }}
              >
                Batal
              </Button>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Nama Lengkap *</Label>
                <Input
                  placeholder="Nama pelanggan..."
                  value={newCustomerName}
                  onChange={(event) => setNewCustomerName(event.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Nomor HP * (untuk struk WA)
                </Label>
                <Input
                  type="tel"
                  placeholder="08xxx..."
                  value={newCustomerPhone}
                  onChange={(event) => setNewCustomerPhone(event.target.value)}
                />
              </div>
              <Button
                onClick={() => void onAddNewCustomer()}
                disabled={
                  addNewLoading ||
                  !newCustomerName.trim() ||
                  !newCustomerPhone.trim()
                }
                className="w-full"
                size="sm"
              >
                {addNewLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Simpan & Lanjutkan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {selectedCustomer && (
          <p className="text-xs text-muted-foreground">
            💡 Struk akan dikirim otomatis ke WhatsApp pelanggan
          </p>
        )}
      </div>

      {selectedCustomer && loyaltyInfo?.enabled && loyaltyInfo.points > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 font-semibold">
                <Gift className="h-4 w-4 text-purple-600" />
                Gunakan Poin Loyalty
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-purple-100 text-purple-800"
                >
                  {loyaltyInfo.points.toLocaleString("id-ID")} poin tersedia
                </Badge>
              </Label>
              <Switch
                checked={usePoints}
                onCheckedChange={(value) => {
                  setUsePoints(value);
                  if (!value) setPointsToRedeem(0);
                }}
              />
            </div>
            {usePoints && (
              <div className="space-y-2 pl-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Jumlah Poin Ditukar</Label>
                    <Input
                      type="number"
                      min={0}
                      max={Math.min(
                        loyaltyInfo.points,
                        Math.ceil(
                          (subtotal + tax - calculatedDiscount) /
                            loyaltyInfo.pointValue,
                        ),
                      )}
                      value={pointsToRedeem || ""}
                      onChange={(event) => {
                        const value = Math.min(
                          Number(event.target.value),
                          loyaltyInfo.points,
                          Math.ceil(
                            (subtotal + tax - calculatedDiscount) /
                              loyaltyInfo.pointValue,
                          ),
                        );
                        setPointsToRedeem(Math.max(0, value));
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground pt-5">
                    = {formatCurrency(pointsToRedeem * loyaltyInfo.pointValue)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() =>
                      setPointsToRedeem(
                        Math.min(
                          loyaltyInfo.points,
                          Math.ceil(
                            (subtotal + tax - calculatedDiscount) /
                              loyaltyInfo.pointValue,
                          ),
                        ),
                      )
                    }
                  >
                    Pakai semua poin
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setPointsToRedeem(0)}
                  >
                    Reset
                  </Button>
                </div>
                {pointsToRedeem > 0 && (
                  <p className="text-xs text-purple-700 font-medium">
                    Diskon poin: -
                    {formatCurrency(
                      Math.min(
                        pointsToRedeem * loyaltyInfo.pointValue,
                        subtotal + tax - calculatedDiscount,
                      ),
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
