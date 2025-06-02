import { Request, Response } from 'express';
import * as doctorService from '../services/doctorService';

export const getAll = async (req: Request, res: Response) => {
  const doctors = await doctorService.getAllDoctors();
  res.json(doctors);
};

export const getById = async (req: Request, res: Response) => {
  const doctor = await doctorService.getDoctorById(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json(doctor);
};

export const create = async (req: Request, res: Response) => {
  const doctor = await doctorService.createDoctor(req.body);
  res.status(201).json(doctor);
};

export const update = async (req: Request, res: Response) => {
  const updated = await doctorService.updateDoctor(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Doctor not found' });
  res.json(updated);
};

export const remove = async (req: Request, res: Response) => {
  await doctorService.deleteDoctor(req.params.id);
  res.json({ message: 'Doctor deleted' });
};
