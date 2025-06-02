import { Doctor } from '../models/Doctor';

export const getAllDoctors = () => Doctor.find().populate('userId', 'fullName email avatar');
export const getDoctorById = (id: string) => Doctor.findById(id).populate('userId', 'fullName email avatar');
export const createDoctor = (data: any) => Doctor.create(data);
export const updateDoctor = (id: string, data: any) => Doctor.findByIdAndUpdate(id, data, { new: true });
export const deleteDoctor = (id: string) => Doctor.findByIdAndDelete(id);
