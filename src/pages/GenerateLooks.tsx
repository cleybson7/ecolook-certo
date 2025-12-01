import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface ClothingItem {
  id: string;
  image_url: string;
  name: string;
  category: string;
  color?: string;
  type?: string;
}

const GenerateLooks = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [generatedLooks, setGeneratedLooks] = useState<any[]>([]);

  const fetchItemsByIds = async (ids: string[]) => {
    const { data, error } = await supabase
      .from("clothing_items")
      .select("id,image_url,name,category,color,type")
      .in("id", ids);

    if (error) {
      console.error(error);
      return [] as ClothingItem[];
    }
    return (data || []) as ClothingItem[];
  };

  const handleGenerate = async () => {
    if (!occasion) {
      toast.error("Selecione uma ocasião");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-looks", {
        body: { occasion },
      });

      if (error) throw error;

      if (data?.looks) {
        const looksWithDetails = await Promise.all(
          data.looks.map(async (look: any) => {
            const itemsData = await fetchItemsByIds(look.items);
            return { ...look, itemsData };
          })
        );
        setGeneratedLooks(looksWithDetails);
        toast.success(`${looksWithDetails.length} looks gerados!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar looks");
    } finally {
      setLoading(false);
    }
  };

  const saveLook = async (look: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Save look
      const { data: lookData, error: lookError } = await supabase
        .from("looks")
        .insert({
          user_id: user.id,
          name: `Look ${occasion}`,
          occasion,
        })
        .select()
        .single();

      if (lookError) throw lookError;

      // Save look items
      const lookItems = look.items.map((itemId: string) => ({
        look_id: lookData.id,
        clothing_item_id: itemId,
      }));

      const { error: itemsError } = await supabase
        .from("look_items")
        .insert(lookItems);

      if (itemsError) throw itemsError;

      toast.success("Look salvo com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar look");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Gerar Looks</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Configure seu Look</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="occasion">Ocasião</Label>
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a ocasião" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="trabalho">Trabalho</SelectItem>
                  <SelectItem value="festa">Festa</SelectItem>
                  <SelectItem value="encontro">Encontro</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="esporte">Esporte</SelectItem>
                  <SelectItem value="viagem">Viagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? "Gerando..." : "Gerar Looks com IA"}
            </Button>
          </CardContent>
        </Card>

        {generatedLooks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-display font-bold">Looks Gerados</h2>
            {generatedLooks.map((look, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Look {index + 1}</h3>
                      <p className="text-sm text-muted-foreground">{look.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => saveLook(look)}
                    >
                      Salvar
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {look.itemsData?.map((item: ClothingItem, i: number) => (
                      <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default GenerateLooks;
