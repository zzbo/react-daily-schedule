import { ReactNode } from 'react';

export interface ScheduleData {
  id: string | number;
  beginTime: number;
  endTime: number;
  meeting: string;
  name: string;
  host: string;
  isMine: boolean;
  isEditable?: boolean;
  isDeleteable?: boolean;
}

export interface DailyScheduleProps {
  title: string | ReactNode;
  scheduleData: ScheduleData[];
  initDate?: number;
  onAdd: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onSelectDate: (timestamp: number) => void;
  onScheduleItemClick: (id: number) => void;
  isShowAddBtn?: boolean;
  isShowAddBtnToolTip?: boolean;
}
