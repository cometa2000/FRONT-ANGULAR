import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-maintenance-modal',
  templateUrl: './maintenance-modal.component.html',
  styleUrls: ['./maintenance-modal.component.scss']
})
export class MaintenanceModalComponent implements OnInit {

  // ============================================
  // 🎛️ CONFIGURACIÓN DEL MODAL
  // ============================================
  
  /**
   * 🔧 CONTROL PRINCIPAL DEL MODAL
   * true = El modal se mostrará a todos los usuarios
   * false = El modal NO se mostrará (actualización completada)
   */
  private readonly SHOW_MAINTENANCE_MODAL = false; // ⬅️ CAMBIAR A false  o true según el estado de la actualización

  /**
   * 📋 CONFIGURACIÓN DE LA ACTUALIZACIÓN
   * Modifica estos valores según la actualización programada
   */
  maintenanceInfo = {
    // Fecha de la actualización
    date: '10 de Febrero de 2026',
    
    // Hora de inicio del mantenimiento
    startTime: '10:00 PM',
    
    // Hora de fin del mantenimiento
    endTime: '12:00 AM',
    
    // Título del aviso
    title: '🔧 Actualización del Sistema Programada',
    
    // Mensaje principal
    message: 'Se realizará una actualización importante del sistema para mejorar el rendimiento y agregar nuevas funcionalidades.',
    
    // Contacto para reportes
    contactArea: 'Área Académica',
    
    // Recomendaciones específicas
    recommendations: [
      'Guarda todos tus documentos e información antes del horario de mantenimiento',
      'No inicies sesión durante el periodo de actualización',
      'Cierra todas las sesiones activas antes de las 10:00 PM',
      'Asegúrate de completar y guardar cualquier tarea en progreso'
    ]
  };

  // Control de visibilidad del modal
  showModal = false;

  // Clave para LocalStorage (evita mostrar múltiples veces en la misma sesión)
  private readonly STORAGE_KEY = 'maintenance_modal_shown_2026_02_10';

  constructor() {}

  ngOnInit(): void {
    this.checkAndShowModal();
  }

  /**
   * 🔍 Verificar si se debe mostrar el modal
   */
  checkAndShowModal() {
    // Si el modal está deshabilitado, no hacer nada
    if (!this.SHOW_MAINTENANCE_MODAL) {
      return;
    }

    // Verificar si ya se mostró en esta sesión
    const alreadyShown = sessionStorage.getItem(this.STORAGE_KEY);
    
    if (!alreadyShown) {
      // Mostrar modal después de un pequeño delay (mejor UX)
      setTimeout(() => {
        this.showModal = true;
      }, 500);
    }
  }

  /**
   * ✅ Entendido - Cerrar modal y marcar como visto
   */
  acknowledgeAndClose() {
    this.showModal = false;
    // Marcar como visto en esta sesión
    sessionStorage.setItem(this.STORAGE_KEY, 'true');
  }

  /**
   * ❌ Cerrar sin marcar (el modal se volverá a mostrar si recarga)
   */
  closeModal() {
    this.showModal = false;
    // No guardamos en sessionStorage, se volverá a mostrar si recarga la página
  }

  /**
   * 📅 Obtener fecha formateada para el countdown
   */
  getMaintenanceDateTime(): string {
    return `${this.maintenanceInfo.date} - ${this.maintenanceInfo.startTime}`;
  }
}