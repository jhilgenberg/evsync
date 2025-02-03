export interface WallboxService {
    getChargingSessions(from?: Date, to?: Date): Promise<any[]>;
    getStatus(): Promise<any>; // Fügen Sie hier weitere Methoden hinzu, die benötigt werden
  }