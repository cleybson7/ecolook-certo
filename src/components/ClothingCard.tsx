import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClothingCardProps {
  item: {
    id: string;
    image_url: string;
    name: string;
    category: string;
    color?: string;
    type?: string;
  };
  onDelete?: (id: string) => void;
}

const ClothingCard = ({ item, onDelete }: ClothingCardProps) => {
  return (
    <Card className="group relative overflow-hidden shadow-card hover:shadow-soft transition-all duration-300">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-medium text-sm truncate">{item.name}</h3>
        <div className="flex gap-1 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {item.category}
          </Badge>
          {item.color && (
            <Badge variant="outline" className="text-xs">
              {item.color}
            </Badge>
          )}
        </div>
      </div>
      {onDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </Card>
  );
};

export default ClothingCard;
