import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductsManager } from "@/components/products-manager"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminShopProductsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  if (profile?.role !== "admin") {
    redirect("/admin")
  }

  // Get shop by ID (admin can access any shop)
  const { data: shop, error: shopError } = await supabase
    .from("repair_shops")
    .select("*")
    .eq("id", id)
    .single()

  if (shopError || !shop) {
    redirect("/admin")
  }

  // Fetch products for the shop
  const { data: products = [] } = await supabase
    .from("shop_products")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Products & Services - {shop.name}</h1>
            <p className="text-muted-foreground">Manage products and services for this shop</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>

        <ProductsManager shop={shop} initialProducts={products} />
      </div>
    </div>
  )
}

