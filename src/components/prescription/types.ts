// Patient shape used by ReadingForm / EyeReadingsEditModal. Lifted out of the
// now-removed ReceiptForm so the reading components can stand on their own.
export interface Patient {
  id: string
  date: string
  patientId: string
  name: string
  guardian?: string
  phone: string
  age: string
  gender: string
  address: string
  dob?: string
  // Legacy uppercase keys some form state still relies on.
  AGE?: string
  GENDER?: string
  ADDRESS?: string
  DOB?: string
  doctorName?: string
  department?: string
  referredBy?: string
  [key: string]: unknown
}
