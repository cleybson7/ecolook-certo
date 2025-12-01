import { NavLink } from "@/components/NavLink";
import { Home, Sparkles, User } from "lucide-react";

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-soft z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">
        <NavLink
          to="/"
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Guarda-Roupa</span>
        </NavLink>
        
        <NavLink
          to="/generate-looks"
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-medium">Gerar Look</span>
        </NavLink>
        
        <NavLink
          to="/profile"
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
