import { formatDate } from '../../../shared/lib/datetime';
import { ActivityItem } from './ActivityItem';
import type { Activity } from '../types/activity.types';

interface ActivityTimelineProps {
  activities: Activity[];
}

/** Vertical timeline grouped by day — server already sorts `createdAt DESC`, we only group. */
export const ActivityTimeline = ({ activities }: ActivityTimelineProps) => {
  const groups: { date: string; items: Activity[] }[] = [];
  for (const activity of activities) {
    const date = formatDate(activity.createdAt);
    const group = groups.at(-1);
    if (group?.date === date) group.items.push(activity);
    else groups.push({ date, items: [activity] });
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          <h3 className="mb-1 text-small font-semibold uppercase tracking-wide text-text-muted">{group.date}</h3>
          <ul className="divide-y divide-border">
            {group.items.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
