import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Trash2, RotateCcw, Loader2 } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '../store';
import { Checkbox } from '@/components/ui/checkbox';

export function TrashDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { trashProfiles, loadTrashProfiles, restoreProfiles, forceDeleteProfiles, isLoading } = useAppStore(
    useShallow((s) => ({
      trashProfiles: s.trashProfiles,
      loadTrashProfiles: s.loadTrashProfiles,
      restoreProfiles: s.restoreProfiles,
      forceDeleteProfiles: s.forceDeleteProfiles,
      isLoading: s.isLoading,
    }))
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTrashProfiles();
      setSelected([]);
    }
  }, [open, loadTrashProfiles]);

  const handleRestore = async (ids: string[]) => {
    setLoadingAction('restore');
    try {
      await restoreProfiles(ids);
      setSelected(selected.filter(id => !ids.includes(id)));
    } catch (err: any) {
      alert('Lỗi khôi phục: ' + err.message);
    }
    setLoadingAction(null);
  };

  const handleForceDelete = async (ids: string[]) => {
    if (!confirm('Bạn có chắc chắn muốn xoá vĩnh viễn? Hành động này KHÔNG THỂ khôi phục!')) return;
    setLoadingAction('delete');
    try {
      await forceDeleteProfiles(ids);
      setSelected(selected.filter(id => !ids.includes(id)));
    } catch (err: any) {
      alert('Lỗi xoá: ' + err.message);
    }
    setLoadingAction(null);
  };

  const allSelected = trashProfiles.length > 0 && selected.length === trashProfiles.length;
  const toggleAll = () => {
    if (allSelected) setSelected([]);
    else setSelected(trashProfiles.map((p) => p.id));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Thùng rác
          </DialogTitle>
          <DialogDescription>
            Các profile đã xoá nằm ở đây. Bạn có thể khôi phục hoặc xoá vĩnh viễn chúng.
          </DialogDescription>
        </DialogHeader>

        {selected.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-md p-2 flex items-center justify-between text-sm mt-2">
            <span className="font-medium px-2">{selected.length} đã chọn</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => handleRestore(selected)}
                disabled={loadingAction !== null}
              >
                {loadingAction === 'restore' ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1.5" />}
                Khôi phục
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleForceDelete(selected)}
                disabled={loadingAction !== null}
              >
                {loadingAction === 'delete' ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                Xoá vĩnh viễn
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto border rounded-md mt-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 shadow-sm border-b">
              <tr>
                <th className="w-10 p-3 text-center">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </th>
                <th className="p-3 text-left font-medium text-slate-500 uppercase tracking-wider text-xs">Tên Profile</th>
                <th className="p-3 text-left font-medium text-slate-500 uppercase tracking-wider text-xs">Hệ Điều Hành</th>
                <th className="p-3 text-right font-medium text-slate-500 uppercase tracking-wider text-xs">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading && trashProfiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : trashProfiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Thùng rác trống
                  </td>
                </tr>
              ) : (
                trashProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 text-center">
                      <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                    </td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{p.name}</td>
                    <td className="p-3 text-slate-500 capitalize">{p.os}</td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Khôi phục"
                        onClick={() => handleRestore([p.id])}
                        disabled={loadingAction !== null}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Xoá vĩnh viễn"
                        onClick={() => handleForceDelete([p.id])}
                        disabled={loadingAction !== null}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
