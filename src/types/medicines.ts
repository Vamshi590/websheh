// Define medicine types
export type Medicine = {
  id: string
  name: string
  timing: string
  days: string
  note: string
  createdAt: string
  updatedAt: string
}

export type MedicineFormData = Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'> | Medicine
