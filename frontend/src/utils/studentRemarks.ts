export const STUDENT_REMARKS_STORAGE_KEY = 'ujaas_student_remarks';

export type StoredStudentRemarks = Record<
  string,
  {
    subjectRemarks?: Record<string, string>;
    adminRemark?: string;
  }
>;

type StudentRemarkFields = {
  id: string;
  subjectRemarks?: Record<string, string>;
  adminRemark?: string;
};

export function readStoredRemarks(): StoredStudentRemarks {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = localStorage.getItem(STUDENT_REMARKS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as StoredStudentRemarks;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeStoredRemarks(
  studentId: string,
  updates: { subjectRemarks?: Record<string, string>; adminRemark?: string },
) {
  if (typeof window === 'undefined') {
    return;
  }

  const current = readStoredRemarks();
  const prevEntry = current[studentId] ?? {};
  current[studentId] = {
    ...prevEntry,
    ...updates,
    subjectRemarks: {
      ...(prevEntry.subjectRemarks ?? {}),
      ...(updates.subjectRemarks ?? {}),
    },
  };

  localStorage.setItem(STUDENT_REMARKS_STORAGE_KEY, JSON.stringify(current));
}

export function withStoredRemarks<T extends StudentRemarkFields>(list: T[]): T[] {
  const stored = readStoredRemarks();

  return list.map((student) => {
    const entry = stored[student.id];
    if (!entry) {
      return student;
    }

    const mergedSubjectRemarks: Record<string, string> = {
      ...(entry.subjectRemarks ?? {}),
      ...(student.subjectRemarks ?? {}),
    };

    const hasServerAdminRemark = typeof student.adminRemark === 'string' && student.adminRemark.trim().length > 0;

    return {
      ...student,
      subjectRemarks: mergedSubjectRemarks,
      adminRemark: hasServerAdminRemark ? student.adminRemark : (entry.adminRemark ?? student.adminRemark),
    };
  });
}
