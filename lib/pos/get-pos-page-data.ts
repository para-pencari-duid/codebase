import db from "@/lib/db";
import type {
  PosBusinessSettings,
  PosCategory,
  PosPageData,
  PosProduct,
} from "@/lib/types/pos";

async function fetchPosProducts() {
  return db.item.findMany({
    where: { isActive: true, type: "GOODS" },
    include: {
      category: true,
      variants: true,
      modifierGroups: {
        where: { isActive: true },
        include: {
          options: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

async function fetchPosCategories() {
  return db.itemCategory.findMany({ orderBy: { name: "asc" } });
}

async function fetchPosSettings() {
  return db.settings.findFirst();
}

type PosProductRecord = Awaited<ReturnType<typeof fetchPosProducts>>[number];
type PosCategoryRecord = Awaited<ReturnType<typeof fetchPosCategories>>[number];
type PosSettingsRecord = Awaited<ReturnType<typeof fetchPosSettings>>;

const DEFAULT_SETTINGS: PosBusinessSettings = {
  taxRate: 11,
  taxIncluded: false,
  businessName: "Toko",
  businessAddress: null,
  businessPhone: null,
  receiptHeader: null,
  receiptFooter: null,
};

function mapProduct(item: PosProductRecord): PosProduct {
  type ProductModifierGroup = PosProductRecord["modifierGroups"][number];
  type ProductModifierOption = ProductModifierGroup["options"][number];

  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    description: item.description,
    images: item.images,
    isActive: item.isActive,
    unit: item.unit,
    categoryId: item.categoryId,
    category: item.category
      ? {
          id: item.category.id,
          name: item.category.name,
          icon: item.category.icon,
          color: item.category.color,
        }
      : null,
    price: Number(item.variants[0]?.price ?? item.basePrice ?? 0),
    cost: Number(item.variants[0]?.cost ?? item.baseCost ?? 0),
    stock: Number(item.variants[0]?.stock ?? 0),
    variantId: item.variants[0]?.id ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    modifierGroups: item.modifierGroups.map((group: ProductModifierGroup) => ({
      id: group.id,
      name: group.name,
      required: group.required,
      multiple: group.multiple,
      maxSelect: group.maxSelect,
      options: group.options
        .filter((option: ProductModifierOption) => option.isActive)
        .sort(
          (left: ProductModifierOption, right: ProductModifierOption) =>
            left.sortOrder - right.sortOrder,
        )
        .map((option: ProductModifierOption) => ({
          id: option.id,
          name: option.name,
          price: Number(option.price),
        })),
    })),
  };
}

function mapCategory(category: PosCategoryRecord): PosCategory {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function mapSettings(settings: PosSettingsRecord): PosBusinessSettings {
  if (!settings) {
    return DEFAULT_SETTINGS;
  }

  return {
    taxRate: settings.taxRate.toNumber(),
    taxIncluded: settings.taxIncluded,
    businessName: settings.businessName,
    businessAddress: settings.businessAddress ?? null,
    businessPhone: settings.businessPhone ?? null,
    receiptHeader: settings.receiptHeader ?? null,
    receiptFooter: settings.receiptFooter ?? null,
  };
}

export async function getPOSPageData(): Promise<PosPageData> {
  const [products, categories, settings] = await Promise.all([
    fetchPosProducts(),
    fetchPosCategories(),
    fetchPosSettings(),
  ]);

  return {
    products: products.map(mapProduct),
    categories: categories.map(mapCategory),
    settings: mapSettings(settings),
  };
}
