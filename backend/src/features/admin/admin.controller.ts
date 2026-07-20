import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';

export class AdminController {
  private adminService = new AdminService();

  createDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.createDriver(req.body, { adminId, adminEmail, ip });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.updateDriver(id, req.body, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  resetDriverPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.resetDriverPassword(id, req.body.new_password, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.admin?.id;
      if (!adminId) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
      const result = await this.adminService.getMe(adminId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  listAdmins = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.listAdmins();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.createAdmin(req.body, { adminId, adminEmail, ip });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.updateAdmin(id, req.body, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.deleteAdmin(id, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  resetAdminToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.resetAdminToken(id, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.listUsers(req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.adminService.updateUser(id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getAuditLogs(req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAuditActions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getAuditActions();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getDashboard();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getAnalytics(req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  exportCsv = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;
      const result = await this.adminService.exportCsv(type);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="jaheez-${type}.csv"`);
      return res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getNotifications();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  sendNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminEmail = req.admin?.email || 'admin';
      const result = await this.adminService.sendNotification(req.body, adminEmail);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getNotificationFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getNotificationFeed();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  listDrivers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter = req.query.filter as string;
      const search = req.query.search as string;
      const result = await this.adminService.listDrivers(filter, search);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getDriverDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.adminService.getDriverDetails(id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  pauseDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { duration_minutes } = req.body;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.pauseDriver(id, duration_minutes, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  forceOffline = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.forceOffline(id, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  suspendDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { duration_hours } = req.body;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.suspendDriver(id, duration_hours, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  manualReassignOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { target_driver_id } = req.body;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.manualReassignOrder(id, target_driver_id, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  setDriverCooldown = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { duration_seconds, reason } = req.body;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.setDriverCooldown(id, duration_seconds, reason, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.deleteDriver(id, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };


  setStoreDispatchMode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { dispatch_mode } = req.body;
      const adminId = req.admin?.id || null;
      const adminEmail = req.admin?.email || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.adminService.setStoreDispatchMode(id, dispatch_mode, { adminId, adminEmail, ip });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };



}
