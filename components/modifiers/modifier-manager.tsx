"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ListPlus,
  Package,
} from "lucide-react";
import {
  formatNumberInputValue,
  parseDigitsToNumber,
} from "@/lib/number-input";
import { formatCurrency } from "@/lib/utils";

interface ModifierOption {
  id?: string;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  maxSelect: number | null;
  sortOrder: number;
  isActive: boolean;
  options: ModifierOption[];
  items: { id: string; name: string; sku: string }[];
}

interface AvailableItem {
  id: string;
  name: string;
  sku: string;
}

interface ModifierManagerProps {
  initialGroups: ModifierGroup[];
  availableItems: AvailableItem[];
}

export function ModifierManager({
  initialGroups,
  availableItems,
}: ModifierManagerProps) {
  const [groups, setGroups] = useState<ModifierGroup[]>(initialGroups);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formRequired, setFormRequired] = useState(false);
  const [formMultiple, setFormMultiple] = useState(true);
  const [formMaxSelect, setFormMaxSelect] = useState<number | "">("");
  const [formOptions, setFormOptions] = useState<ModifierOption[]>([
    { name: "", price: 0, isActive: true, sortOrder: 0 },
  ]);
  const [formItemIds, setFormItemIds] = useState<Set<string>>(new Set());

  const resetForm = () => {
    setFormName("");
    setFormRequired(false);
    setFormMultiple(true);
    setFormMaxSelect("");
    setFormOptions([{ name: "", price: 0, isActive: true, sortOrder: 0 }]);
    setFormItemIds(new Set());
    setEditingGroup(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (group: ModifierGroup) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormRequired(group.required);
    setFormMultiple(group.multiple);
    setFormMaxSelect(group.maxSelect ?? "");
    setFormOptions(group.options.map((o) => ({ ...o })));
    setFormItemIds(new Set(group.items.map((i) => i.id)));
    setDialogOpen(true);
  };

  const addOption = () => {
    setFormOptions([
      ...formOptions,
      { name: "", price: 0, isActive: true, sortOrder: formOptions.length },
    ]);
  };

  const removeOption = (idx: number) => {
    if (formOptions.length <= 1) return;
    setFormOptions(formOptions.filter((_, i) => i !== idx));
  };

  const updateOption = (
    idx: number,
    field: keyof ModifierOption,
    value: any,
  ) => {
    const updated = [...formOptions];
    (updated[idx] as any)[field] = value;
    setFormOptions(updated);
  };

  const toggleItem = (itemId: string) => {
    const next = new Set(formItemIds);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setFormItemIds(next);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    const validOptions = formOptions.filter((o) => o.name.trim());
    if (validOptions.length === 0) {
      toast.error("Minimal 1 option");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formName.trim(),
        required: formRequired,
        multiple: formMultiple,
        maxSelect: formMaxSelect ? Number(formMaxSelect) : null,
        options: validOptions.map((o, i) => ({
          name: o.name.trim(),
          price: Number(o.price) || 0,
          isActive: o.isActive,
          sortOrder: i,
        })),
        itemIds: Array.from(formItemIds),
      };

      let res: Response;
      if (editingGroup) {
        res = await fetch(`/api/modifiers/${editingGroup.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/modifiers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("API error");
      const saved = await res.json();

      if (editingGroup) {
        setGroups(groups.map((g) => (g.id === saved.id ? saved : g)));
        toast.success("Modifier berhasil diperbarui");
      } else {
        setGroups([...groups, saved]);
        toast.success("Modifier berhasil ditambahkan");
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Gagal menyimpan modifier");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm("Hapus modifier group ini?")) return;
    try {
      const res = await fetch(`/api/modifiers/${groupId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setGroups(groups.filter((g) => g.id !== groupId));
      toast.success("Modifier berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus modifier");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Modifier</h1>
          <p className="text-muted-foreground text-sm">
            Kelola modifier / add-on untuk produk (topping, level gula, ukuran,
            dll.)
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Tambah Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
            <ListPlus className="h-12 w-12 opacity-30" />
            <div>
              <p className="font-semibold">Belum ada modifier group</p>
              <p className="text-sm">
                Buat modifier group pertama untuk mulai menambahkan add-on ke
                produk.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={openCreate}
              className="gap-1.5 mt-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <CardDescription className="mt-1 flex gap-1.5 flex-wrap">
                      {group.required && (
                        <Badge variant="destructive" className="text-[10px]">
                          Wajib
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {group.multiple ? "Multi-pilih" : "Pilih 1"}
                      </Badge>
                      {group.maxSelect && (
                        <Badge variant="outline" className="text-[10px]">
                          Maks. {group.maxSelect}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(group)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(group.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="space-y-1">
                  {group.options.map((opt) => (
                    <div
                      key={opt.id || opt.name}
                      className="flex justify-between text-sm py-1 px-2 bg-slate-50 rounded"
                    >
                      <span>{opt.name}</span>
                      {opt.price > 0 && (
                        <span className="text-muted-foreground">
                          +{formatCurrency(opt.price)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {group.items.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-1 flex-wrap">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      {group.items.slice(0, 3).map((it) => (
                        <Badge
                          key={it.id}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {it.name}
                        </Badge>
                      ))}
                      {group.items.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{group.items.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Edit Modifier Group" : "Tambah Modifier Group"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Nama Group *</Label>
              <Input
                placeholder="Contoh: Level Gula, Topping, Ukuran"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* Settings row */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formRequired}
                  onCheckedChange={setFormRequired}
                  id="required"
                />
                <Label htmlFor="required" className="text-sm">
                  Wajib dipilih
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formMultiple}
                  onCheckedChange={setFormMultiple}
                  id="multiple"
                />
                <Label htmlFor="multiple" className="text-sm">
                  Multi-pilih
                </Label>
              </div>
            </div>

            {formMultiple && (
              <div className="space-y-1.5">
                <Label>Maks. pilihan (kosongkan = tak terbatas)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Contoh: 3"
                  value={formMaxSelect}
                  onChange={(e) =>
                    setFormMaxSelect(
                      e.target.value ? parseInt(e.target.value) : "",
                    )
                  }
                />
              </div>
            )}

            <Separator />

            {/* Options */}
            <div className="space-y-2">
              <Label>Options *</Label>
              {formOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nama option"
                    className="flex-1"
                    value={opt.name}
                    onChange={(e) => updateOption(idx, "name", e.target.value)}
                  />
                  <Input
                    type="text"
                    inputMode="numeric"
                    aria-label={`Harga option ${idx + 1}`}
                    placeholder="Harga"
                    className="w-28"
                    value={formatNumberInputValue(opt.price)}
                    onChange={(e) =>
                      updateOption(
                        idx,
                        "price",
                        parseDigitsToNumber(e.target.value),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive shrink-0"
                    disabled={formOptions.length <= 1}
                    onClick={() => removeOption(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Option
              </Button>
            </div>

            <Separator />

            {/* Assign to Items */}
            <div className="space-y-2">
              <Label>Terapkan ke Produk</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                {availableItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formItemIds.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="rounded"
                    />
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {item.sku}
                    </span>
                  </label>
                ))}
                {availableItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada produk
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading
                ? "Menyimpan..."
                : editingGroup
                  ? "Simpan Perubahan"
                  : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
