import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const Profile = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-display font-bold">Perfil</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => toast.info("Em breve")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Preferências
            </Button>

            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
