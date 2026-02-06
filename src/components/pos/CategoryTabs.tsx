import { Category } from "@/types/pos";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryTabs = ({ categories, selectedCategory, onSelectCategory }: CategoryTabsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelectCategory(null)}
        className={cn(
          "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200",
          selectedCategory === null
            ? "bg-primary text-primary-foreground glow-primary"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        All Items
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 flex items-center gap-2",
            selectedCategory === category.id
              ? "bg-primary text-primary-foreground glow-primary"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {category.icon && <span>{category.icon}</span>}
          {category.name}
        </button>
      ))}
    </div>
  );
};
