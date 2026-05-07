export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';
export type Priority = 'IMPORTANT' | 'LOW' | 'AVOID';
export type StudyType = 'WGS' | 'WES' | 'PANEL' | 'RNA';
export type StudyStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type VariantType = 'SNV' | 'INDEL' | 'CNV' | 'SV';
export type Zygosity = 'HETEROZYGOUS' | 'HOMOZYGOUS' | 'HEMIZYGOUS';
export type ClinicalSignificance = 'PATHOGENIC' | 'LIKELY_PATHOGENIC' | 'VUS' | 'LIKELY_BENIGN' | 'BENIGN';

export interface Team {
  id: string;
  name: string;
  description?: string;
  role: Role;
  patientCount?: number;
  memberCount?: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  teams: Team[];
}

export interface Patient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  ethnicity?: string;
  diagnosis: string;
  ownerTeam: { id: string; name: string };
  _count: { studies: number; variants: number };
}

export interface Study {
  id: string;
  patientId: string;
  studyName: string;
  studyType: StudyType;
  sequencingPlatform?: string;
  dateConducted: string;
  status: StudyStatus;
  notes?: string;
  _count?: { variants: number };
}

export interface VariantNote {
  id: string;
  variantId: string;
  noteText: string;
  createdAt: string;
  user: { name: string; username: string };
}

export interface VariantPriority {
  id: string;
  priority: Priority;
  updatedAt: string;
  setByUser: { name: string };
  team: { name: string };
}

export interface AuditEntry {
  id: string;
  oldPriority?: Priority;
  newPriority: Priority;
  changedAt: string;
  user: { name: string; username: string };
}

export interface Variant {
  id: string;
  patientId: string;
  studyId?: string;
  chromosome: string;
  position: number;
  refAllele: string;
  altAllele: string;
  geneName: string;
  rsId?: string;
  variantType: VariantType;
  zygosity: Zygosity;
  alleleFrequency?: number;
  caddScore?: number;
  clinicalSignificance: ClinicalSignificance;
  consequence: string;
  proteinChange?: string;
  hgvsC?: string;
  gnomadAf?: number;
  siftPrediction?: string;
  polyphenPrediction?: string;
  priorities: VariantPriority[];
  notes: VariantNote[];
  study?: { studyName: string; studyType: StudyType };
}
