import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export type SkinTag = {
  id: string;
  name: string;
  color: string;
};

export type SkinTagAssignment = {
  skinId: number;
  tagIds: string[];
};

type TagsPanelProps = {
  tags: SkinTag[];
  onUpdateTags: (tags: SkinTag[]) => void;
  tagAssignments: SkinTagAssignment[];
  onBack: () => void;
};

export default function TagsPanel({ tags, onUpdateTags, tagAssignments, onBack }: TagsPanelProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#4CAF50');
  const [editingTag, setEditingTag] = useState<SkinTag | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<SkinTag | null>(null);

  // Get usage count for each tag
  const getTagUsageCount = (tagId: string) => {
    return tagAssignments.filter(assignment => assignment.tagIds.includes(tagId)).length;
  };

  // Add a new tag
  const handleAddTag = () => {
    if (!newTagName.trim()) {
      return;
    }

    const newTag: SkinTag = {
      id: `custom-${Date.now()}`,
      name: newTagName.trim(),
      color: newTagColor,
    };

    onUpdateTags([...tags, newTag]);
    setNewTagName('');
    setNewTagColor('#4CAF50');
    setIsAddDialogOpen(false);
  };

  // Update an existing tag
  const handleUpdateTag = () => {
    if (!editingTag || !editingTag.name.trim()) {
      return;
    }

    onUpdateTags(tags.map(tag => (tag.id === editingTag.id ? editingTag : tag)));
    setEditingTag(null);
    setIsEditDialogOpen(false);
  };

  // Delete a tag
  const handleDeleteTag = () => {
    if (!tagToDelete) {
      return;
    }

    onUpdateTags(tags.filter(tag => tag.id !== tagToDelete.id));
    setTagToDelete(null);
  };

  // Predefined colors for tag selection
  const colorOptions = [
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#F44336', // Red
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#FFEB3B', // Yellow
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#E91E63', // Pink
    '#00BCD4', // Cyan
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold ml-2">Tag Management</h1>
        <Button className="ml-auto" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {/* Tag list */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Default Tags</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tags
                .filter(
                  tag => tag.id.startsWith('favorite') || tag.id.startsWith('owned') || tag.id.startsWith('wishlist'),
                )
                .map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 rounded-md border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tag.color }} />
                      <div>
                        <p className="font-medium">{tag.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getTagUsageCount(tag.id)}
                          {' '}
                          skins
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      Default
                    </Badge>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Custom Tags</h2>
            {tags.filter(
              tag => !tag.id.startsWith('favorite') && !tag.id.startsWith('owned') && !tag.id.startsWith('wishlist'),
            ).length === 0
              ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No custom tags yet</p>
                    <p className="text-sm">Create custom tags to organize your skins</p>
                  </div>
                )
              : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {tags
                        .filter(
                          tag =>
                            !tag.id.startsWith('favorite') && !tag.id.startsWith('owned') && !tag.id.startsWith('wishlist'),
                        )
                        .map(tag => (
                          <motion.div
                            key={tag.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-between p-3 rounded-md border border-border bg-card"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tag.color }} />
                              <div>
                                <p className="font-medium">{tag.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getTagUsageCount(tag.id)}
                                  {' '}
                                  skins
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingTag(tag);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setTagToDelete(tag)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                )}
          </div>
        </div>
      </ScrollArea>

      {/* Add tag dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="tagName" className="text-sm font-medium">
                Tag Name
              </label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tag Color</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-all ${
                      newTagColor === color ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTag}>Add Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit tag dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          {editingTag && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="editTagName" className="text-sm font-medium">
                  Tag Name
                </label>
                <Input
                  id="editTagName"
                  value={editingTag.name}
                  onChange={e => setEditingTag({ ...editingTag, name: e.target.value })}
                  placeholder="Enter tag name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tag Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full transition-all ${
                        editingTag.color === color ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingTag({ ...editingTag, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTag(null);
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTag}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!tagToDelete} onOpenChange={() => setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "
              {tagToDelete?.name}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
