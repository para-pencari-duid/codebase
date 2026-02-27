export interface PosModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface PosModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  maxSelect: number | null;
  options: PosModifierOption[];
}

export interface PosProductCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  images: string[];
  isActive: boolean;
  unit: string;
  categoryId: string | null;
  category: PosProductCategory | null;
  price: number;
  cost: number;
  stock: number;
  variantId: string | null;
  createdAt: string;
  updatedAt: string;
  modifierGroups: PosModifierGroup[];
}

export interface PosCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PosBusinessSettings {
  taxRate: number;
  taxIncluded: boolean;
  businessName: string;
  businessAddress: string | null;
  businessPhone: string | null;
  receiptHeader: string | null;
  receiptFooter: string | null;
}

export interface PosPageData {
  products: PosProduct[];
  categories: PosCategory[];
  settings: PosBusinessSettings;
}
