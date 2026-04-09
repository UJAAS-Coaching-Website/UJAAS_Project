import { useCallback, useRef, useState } from 'react';
import {
  deleteQuery as apiDeleteQuery,
  submitQuery as apiSubmitQuery,
  updateLandingData as apiUpdateLanding,
  updateQueryStatus as apiUpdateQueryStatus,
} from '../api/landing';
import type { LandingData, LandingQuery } from '../App';

const defaultLandingData: LandingData = {
  courses: [
    { id: 'fallback-1', name: 'JEE MAINS / ADVANCED' },
    { id: 'fallback-2', name: 'NEET' },
    { id: 'fallback-3', name: 'BOARDS' },
    { id: 'fallback-4', name: 'GUJCET' },
    { id: 'fallback-5', name: '11TH SCIENCE' },
    { id: 'fallback-6', name: '12TH SCIENCE' },
    { id: 'fallback-7', name: '7TH TO 10TH FOUNDATION' },
    { id: 'fallback-8', name: 'DROPPER BATCH' },
  ],
  faculty: [],
  achievers: [],
  visions: [],
  contact: {
    phone: '+91 98765 43210',
    email: 'info@ujaas.com',
    address: '123 Education St, Delhi',
  },
};

function getStoredLandingData() {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('ujaasLandingData');
  } catch (e) {
    console.warn('localStorage is not accessible', e);
  }

  if (!stored) {
    return defaultLandingData;
  }

  try {
    const parsed = JSON.parse(stored);
    const mergedVisions = [...(Array.isArray(parsed.visions) ? parsed.visions : [])];

    defaultLandingData.visions.forEach((vision) => {
      if (!mergedVisions.some((storedVision) => storedVision.id === vision.id)) {
        mergedVisions.push(vision);
      }
    });

    return {
      ...defaultLandingData,
      ...parsed,
      courses: Array.isArray(parsed.courses) ? parsed.courses : defaultLandingData.courses,
      faculty: Array.isArray(parsed.faculty) ? parsed.faculty : defaultLandingData.faculty,
      achievers: Array.isArray(parsed.achievers) ? parsed.achievers : defaultLandingData.achievers,
      visions: mergedVisions,
      contact: parsed.contact || defaultLandingData.contact,
    };
  } catch (error) {
    console.error('Failed to parse landing data', error);
    return defaultLandingData;
  }
}

export function useLandingContent() {
  const [queries, setQueries] = useState<LandingQuery[]>([]);
  const [landingData, setLandingData] = useState<LandingData>(() => getStoredLandingData());
  const hasShownStorageWarning = useRef(false);

  const safeSetLocalStorage = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to persist ${key} in localStorage`, error);
      if (
        key === 'ujaasLandingData' &&
        !hasShownStorageWarning.current &&
        typeof window !== 'undefined'
      ) {
        hasShownStorageWarning.current = true;
        window.alert('Storage is full. New faculty/achiever images will work now but may not be saved after refresh. Use smaller images.');
      }
    }
  }, []);

  const handleAddQuery = useCallback(async (query: { name: string; email: string; phone: string; courseId: string; message?: string }) => {
    try {
      const newQuery = await apiSubmitQuery(query);
      setQueries((prev) => [newQuery as LandingQuery, ...prev]);
    } catch (error) {
      console.error('Failed to submit query:', error);
      const courseName = landingData.courses.find((course) => course.id === query.courseId)?.name ?? query.courseId;
      const fallback: LandingQuery = {
        name: query.name,
        email: query.email,
        phone: query.phone,
        course: courseName,
        courseId: query.courseId,
        message: query.message,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        status: 'new',
      };
      setQueries((prev) => [fallback, ...prev]);
    }
  }, [landingData.courses]);

  const handleUpdateQueries = useCallback(async (updatedQueries: LandingQuery[]) => {
    for (const query of updatedQueries) {
      const previousQuery = queries.find((existingQuery) => existingQuery.id === query.id);
      if (previousQuery && previousQuery.status !== query.status) {
        try {
          await apiUpdateQueryStatus(query.id, query.status);
        } catch (error) {
          console.error('Failed to update query status:', error);
        }
      }
    }

    setQueries(updatedQueries);
  }, [queries]);

  const handleDeleteQuery = useCallback(async (id: string) => {
    try {
      await apiDeleteQuery(id);
      setQueries((prev) => prev.filter((query) => query.id !== id));
    } catch (error) {
      console.error('Failed to delete query:', error);
    }
  }, []);

  const handleUpdateLandingData = useCallback(async (data: LandingData) => {
    setLandingData(data);
    safeSetLocalStorage('ujaasLandingData', JSON.stringify(data));
    try {
      await apiUpdateLanding(data);
    } catch (error) {
      console.error('Failed to save landing data to API:', error);
      throw error;
    }
  }, [safeSetLocalStorage]);

  return {
    landingData,
    queries,
    setLandingData,
    setQueries,
    safeSetLocalStorage,
    handleAddQuery,
    handleUpdateQueries,
    handleDeleteQuery,
    handleUpdateLandingData,
  };
}
