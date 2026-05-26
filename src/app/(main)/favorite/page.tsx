import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteDesigners, getFavoritePortfolios } from "@/lib/favorites/queries";
import FavoriteClient from "./FavoriteClient";

export default async function FavoritePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const [designers, portfolios] = await Promise.all([
    getFavoriteDesigners(),
    getFavoritePortfolios(),
  ]);

  return <FavoriteClient designers={designers} portfolios={portfolios} />;
}
