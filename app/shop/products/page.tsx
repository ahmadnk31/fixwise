import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { ProductsManager } from "@/components/products-manager"

export default async function ProductsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: shop } = await supabase.from("repair_shops").select("*").eq("owner_id", user.id).single()

  if (!shop) {
    redirect("/shop/settings")
  }

  const { data: products } = await supabase
    .from("shop_products")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })

  return <ProductsManager shop={shop} initialProducts={products || []} />
}
