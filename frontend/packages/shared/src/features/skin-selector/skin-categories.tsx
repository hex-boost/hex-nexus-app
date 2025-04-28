import { Button } from '@/components/ui/button.tsx';
import { motion } from 'framer-motion';
import { Crown, DollarSign, Sparkles, Star, TrendingUp } from 'lucide-react';

const CATEGORIES = [
  { id: 'recent', name: 'New Releases', icon: Sparkles, color: '#4CAF50' },
  { id: 'popular', name: 'Popular', icon: TrendingUp, color: '#2196F3' },
  { id: 'sale', name: 'On Sale', icon: DollarSign, color: '#FF9800' },
  { id: 'legendary', name: 'Legendary', icon: Crown, color: '#F44336' },
  { id: 'ultimate', name: 'Ultimate', icon: Star, color: '#9C27B0' },
];

type SkinCategoriesProps = {
  onSelectCategory: (categoryId: string) => void;
  selectedCategory?: string | null;
};

export function SkinCategories({ onSelectCategory, selectedCategory }: SkinCategoriesProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-3">Categories</h3>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;

          return (
            <motion.div key={category.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-2"
                style={{
                  backgroundColor: isSelected ? category.color : 'transparent',
                  borderColor: category.color,
                  color: isSelected ? 'white' : category.color,
                }}
                onClick={() => onSelectCategory(category.id)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.name}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
