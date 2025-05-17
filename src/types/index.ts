export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  description?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: ChecklistItem[];
}

export type Category = 'code' | 'deployment' | 'communication' | 'monitoring' | 'documentation' | 'testing' | 'security' | 'operations';