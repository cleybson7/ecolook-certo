import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";

const AddItem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: "",
    color: "",
    pattern: "",
    material: "",
    style: "",
    description_short: "",
    description_long: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!imageFile) return;

    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data, error } = await supabase.functions.invoke("analyze-clothing", {
          body: { image: base64Image },
        });

        if (error) throw error;

        if (data) {
          setFormData((prev) => ({
            ...prev,
            ...data,
          }));
          toast.success("Análise concluída!");
        }
      };
    } catch (error) {
      console.error(error);
      toast.error("Erro ao analisar imagem");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Por favor, adicione uma imagem");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Upload image to storage
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("clothing-images")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("clothing-images")
        .getPublicUrl(fileName);

      // Insert into database
      const { error: insertError } = await supabase.from("clothing_items").insert({
        user_id: user.id,
        image_url: publicUrl,
        ...formData,
      });

      if (insertError) throw insertError;

      toast.success("Peça adicionada com sucesso!");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar peça");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Adicionar Peça</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Nova Peça</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Foto da Peça</Label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded-lg" />
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Clique para adicionar foto</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      required
                    />
                  </label>
                </div>
                {imageFile && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {analyzing ? "Analisando..." : "Analisar com IA"}
                  </Button>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Peça</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superior">Superior</SelectItem>
                      <SelectItem value="inferior">Inferior</SelectItem>
                      <SelectItem value="sapato">Sapato</SelectItem>
                      <SelectItem value="acessorio">Acessório</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Ex: Camisa, Calça, Tênis"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Ex: Azul, Preto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pattern">Padrão</Label>
                  <Input
                    id="pattern"
                    value={formData.pattern}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    placeholder="Ex: Liso, Xadrez"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="Ex: Algodão, Jeans"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Peça"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddItem;
