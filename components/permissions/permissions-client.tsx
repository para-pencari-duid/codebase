"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLES = ["OWNER", "ADMIN", "STAFF", "CASHIER"] as const;
const RESOURCES = ["orders", "products", "customers", "reports", "settings"] as const;
const ACTIONS = ["read", "write", "delete"] as const;

type Role = (typeof ROLES)[number];
type Resource = (typeof RESOURCES)[number];
type Action = (typeof ACTIONS)[number];

type PermissionMatrix = Record<Role, Record<Resource, Record<Action, boolean>>>;

const defaultMatrix = (): PermissionMatrix => {
  const matrix = {} as PermissionMatrix;
  for (const role of ROLES) {
    matrix[role] = {} as Record<Resource, Record<Action, boolean>>;
    for (const resource of RESOURCES) {
      matrix[role][resource] = { read: false, write: false, delete: false };
    }
  }
  return matrix;
};

export default function PermissionsClient() {
  const [matrix, setMatrix] = useState<PermissionMatrix>(defaultMatrix());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/permissions");
      const data = await res.json();
      if (data.matrix) {
        setMatrix(data.matrix);
      } else {
        // Build matrix from flat array
        const m = defaultMatrix();
        const perms: { role: Role; resource: Resource; action: Action; allowed: boolean }[] = data.permissions ?? data;
        for (const p of perms) {
          if (m[p.role]?.[p.resource]) {
            m[p.role][p.resource][p.action] = p.allowed;
          }
        }
        setMatrix(m);
      }
    } catch {
      toast.error("Gagal memuat izin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPermissions(); }, []);

  const toggle = (role: Role, resource: Resource, action: Action) => {
    setMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [resource]: {
          ...prev[role][resource],
          [action]: !prev[role][resource][action],
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrix }),
      });
      if (!res.ok) throw new Error();
      toast.success("Izin berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan izin");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Matriks Izin</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      {ROLES.map(role => (
        <Card key={role}>
          <CardHeader>
            <CardTitle className="text-base">{role}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4 w-32">Resource</th>
                    {ACTIONS.map(a => (
                      <th key={a} className="text-center py-2 px-4 capitalize">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESOURCES.map(resource => (
                    <tr key={resource} className="border-t">
                      <td className="py-2 pr-4 font-medium capitalize">{resource}</td>
                      {ACTIONS.map(action => (
                        <td key={action} className="text-center py-2 px-4">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-primary"
                            checked={matrix[role][resource][action]}
                            onChange={() => toggle(role, resource, action)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
