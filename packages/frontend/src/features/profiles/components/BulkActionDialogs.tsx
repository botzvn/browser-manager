import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGroupStore } from "../../groups/store";
import { useAppStore } from "../../profiles/store";

export function BulkLabelDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [tags, setTags] = useState("");
  const { bulkUpdateProfiles, selectedProfiles } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await bulkUpdateProfiles(selectedProfiles, { tags });
      // clearProfileSelection(); // Usually we want to keep selection or clear it based on preference
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Labels</DialogTitle>
          <DialogDescription>
            Enter tags (comma separated) for {selectedProfiles.length} selected profiles.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            Labels / Tags
          </label>
          <Input 
            placeholder="e.g. facebook, running, target-1" 
            value={tags} 
            onChange={(e) => setTags(e.target.value)} 
          />
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={handleSubmit} disabled={isLoading || !tags.trim()}>
            {isLoading ? "Saving..." : "Apply Labels"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkGroupDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [groupId, setGroupId] = useState<string>("uncategorized");
  const { groups } = useGroupStore();
  const { bulkUpdateProfiles, selectedProfiles } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await bulkUpdateProfiles(selectedProfiles, { group_id: groupId === "uncategorized" ? undefined : groupId });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Group</DialogTitle>
          <DialogDescription>
            Select a group to move {selectedProfiles.length} profiles to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={groupId} onValueChange={(val) => val && setGroupId(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uncategorized">No Group (Uncategorized)</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Move Profiles"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkModifyDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [notes, setNotes] = useState("");
  const { bulkUpdateProfiles, selectedProfiles } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (notes.trim()) {
        await bulkUpdateProfiles(selectedProfiles, { notes });
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Modify Profiles</DialogTitle>
          <DialogDescription>
            Modify common attributes for {selectedProfiles.length} selected profiles. Details to be extended later.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Notes
            </label>
            <Input 
              placeholder="Override notes for selected profiles..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
            />
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={handleSubmit} disabled={isLoading || !notes.trim()}>
            {isLoading ? "Saving..." : "Modify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkTransferDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [email, setEmail] = useState("");
  const { selectedProfiles } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    // STUB: Since no actual API exists yet for transfer, just simulate success or alert
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Transfer initiated for ${selectedProfiles.length} profiles to ${email}. Feature API is stubbed.`);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Profiles</DialogTitle>
          <DialogDescription>
            Transfer {selectedProfiles.length} profiles to another user account. This operation cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            Recipient Username or Email
          </label>
          <Input 
            placeholder="user@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <DialogFooter showCloseButton>
          <Button variant="outline" className="bg-primary text-white hover:bg-primary/90 hover:text-white border-0" onClick={handleSubmit} disabled={isLoading || !email.trim()}>
            {isLoading ? "Transferring..." : "Confirm Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
