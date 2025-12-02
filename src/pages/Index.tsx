import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import ClothingCard from "@/components/ClothingCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ClothingItem {
  id: string;
  image_url: string;
  name: string;
  category: string;
  color?: string;
  type?: string;
}

interface Look {
  id: string;
  name: string;
  occasion: string;
  is_favorite: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [looks, setLooks] = useState<any[]>([]);
  const [selectedLook, setSelectedLook] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchClothingItems();
    fetchLooks();
  };

  const fetchClothingItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clothing_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar peças");
      console.error(error);
    } else {
      setClothingItems(data || []);
    }
    setLoading(false);
  };

  const fetchLooks = async () => {
    const { data, error } = await supabase
      .from("looks")
      .select("*, look_items:look_items(clothing_items(*))")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      const enriched = (data || []).map((look: any) => ({
        ...look,
        items: (look.look_items || [])
          .map((li: any) => li.clothing_items)
          .filter(Boolean),
      }));
      setLooks(enriched);
    }
  };

  const deleteLook = async (id: string) => {
    if (!confirm("Deseja excluir este look?")) return;
    const { error } = await supabase
      .from("looks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      toast.error("Erro ao excluir look");
    } else {
      toast.success("Look excluído");
      fetchLooks();
    }
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase
      .from("clothing_items")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao deletar peça");
    } else {
      toast.success("Peça deletada com sucesso");
      fetchClothingItems();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-primary">EcoLook</h1>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="pieces" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pieces">Minhas Peças</TabsTrigger>
            <TabsTrigger value="looks">Meus Looks</TabsTrigger>
          </TabsList>

          <TabsContent value="pieces">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando...
              </div>
            ) : clothingItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhuma peça cadastrada ainda
                </p>
                <Button onClick={() => navigate("/add-item")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar primeira peça
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {clothingItems.map((item) => (
                  <ClothingCard
                    key={item.id}
                    item={item}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="looks">
            {looks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhum look salvo ainda
                </p>
                <Button onClick={() => navigate("/generate-looks")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar primeiro look
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {looks.map((look) => (
                  <div
                    key={look.id}
                    className="relative text-left p-4 bg-card rounded-lg shadow-card hover:shadow-soft transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedLook(look);
                      setDetailsOpen(true);
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLook(look.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <h3 className="font-medium">{look.name}</h3>
                    <p className="text-sm text-muted-foreground">{look.occasion}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {look.items?.slice(0, 3).map((item: ClothingItem, i: number) => (
                        <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Button
        size="lg"
        className="fixed bottom-24 right-6 rounded-full shadow-soft h-14 w-14"
        onClick={() => navigate("/add-item")}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <BottomNav />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLook?.name}</DialogTitle>
            <DialogDescription>{selectedLook?.occasion}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {selectedLook?.items?.map((item: ClothingItem) => (
              <div key={item.id} className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {selectedLook?.items?.map((item: ClothingItem) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category}{item.color ? ` • ${item.color}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
