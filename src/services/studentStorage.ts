export interface StudentProfile {
  studentId: string;
  registerNumber: string;
  rollNumber: string;
  studentName: string;
  department: string;
  year: string;
  section: string;
  phoneNumber?: string;
  email?: string;
  mentorName?: string;
  deviceIdentifier: string;
  registeredAt: string;
}

const STORAGE_KEY = 'sc_student_profile_v1';
const DEVICE_KEY = 'sc_device_id_v1';

/**
 * StorageService abstraction layer.
 * Version 1 uses LocalStorage with API syncing.
 * Future versions can replace or enhance these methods to use Supabase / Firestore backend seamlessly.
 */
export const StorageService = {
  // Get unique device identifier (creates if not existing)
  getDeviceId(): string {
    let devId = localStorage.getItem(DEVICE_KEY);
    if (!devId) {
      devId = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now();
      localStorage.setItem(DEVICE_KEY, devId);
    }
    return devId;
  },

  // Get saved profile from local storage
  getProfile(): StudentProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StudentProfile;
    } catch (e) {
      console.error('Error reading student profile from storage:', e);
      return null;
    }
  },

  // Save or update student profile locally (and sync back if needed)
  saveProfile(profile: StudentProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      // Also sync roll to legacy key for backwards compatibility
      localStorage.setItem('sc_direct_roll', profile.rollNumber || profile.registerNumber);
    } catch (e) {
      console.error('Error saving student profile to storage:', e);
    }
  },

  // Update editable contact fields (Phone, Email)
  updateProfileContact(phoneNumber: string, email: string): StudentProfile | null {
    const current = this.getProfile();
    if (!current) return null;
    const updated: StudentProfile = {
      ...current,
      phoneNumber,
      email
    };
    this.saveProfile(updated);
    return updated;
  },

  // Clear local profile (for device unlinking or profile reset)
  clearProfile(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('sc_direct_roll');
  },

  // Helper to create a standard profile object from student verification data
  createProfileFromData(data: {
    rollNumber: string;
    registerNumber: string;
    studentName: string;
    department: string;
    year: string;
    section: string;
    phoneNumber?: string;
    email?: string;
    mentorName?: string;
  }): StudentProfile {
    const deviceIdentifier = this.getDeviceId();
    const existing = this.getProfile();

    const profile: StudentProfile = {
      studentId: existing?.studentId || 'STU-' + (data.registerNumber || data.rollNumber) + '-' + Math.floor(1000 + Math.random() * 9000),
      registerNumber: data.registerNumber || data.rollNumber,
      rollNumber: data.rollNumber || data.registerNumber,
      studentName: data.studentName,
      department: data.department || 'AI&DS',
      year: data.year || 'I',
      section: data.section || 'A',
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      mentorName: data.mentorName || '',
      deviceIdentifier,
      registeredAt: existing?.registeredAt || new Date().toISOString()
    };

    this.saveProfile(profile);
    return profile;
  }
};
