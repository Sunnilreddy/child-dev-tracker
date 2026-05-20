import { useMemo, useState } from 'react';
import activitiesData from '../data/activities.json';
import { Activity, Category, DevFocus } from '../types';

const allActivities = activitiesData.activities as Activity[];

export function useActivities(category?: Category, focusFilter?: DevFocus | 'all') {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = category ? allActivities.filter((a) => a.category === category) : allActivities;

    if (focusFilter && focusFilter !== 'all') {
      result = result.filter((a) => a.developmentalFocus.includes(focusFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.titleTe ?? '').includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.descriptionTe ?? '').includes(q) ||
          a.tags.some((t) => t.includes(q))
      );
    }

    return result;
  }, [category, focusFilter, searchQuery]);

  const featuredActivity = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return allActivities[dayOfYear % allActivities.length];
  }, []);

  return { activities: filtered, featuredActivity, searchQuery, setSearchQuery, allActivities };
}
