import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/modules/auth';

export interface User {
  id: number;
  name: string;
  surname?: string;
  email: string;
  avatar?: string;
}

export interface ChecklistItem {
  id?: number;
  name: string;
  completed: boolean;
  checklist_id?: number;
  orden?: number;
  due_date?: string;
  assigned_users?: User[];
  is_overdue?: boolean;
  is_due_soon?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Checklist {
  id?: number;
  name: string;
  tarea_id?: number;
  orden?: number;
  progress?: number;
  items?: ChecklistItem[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistsService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  // ========== CHECKLISTS ==========

  // Obtener todos los checklists de una tarea
  getChecklists(tareaId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists";
    return this.http.get(URL, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Crear un nuevo checklist
  createChecklist(tareaId: number, checklist: Checklist): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists";
    return this.http.post(URL, checklist, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Actualizar un checklist
  updateChecklist(tareaId: number, checklistId: number, checklist: Checklist): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/" + checklistId;
    return this.http.put(URL, checklist, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Eliminar un checklist
  deleteChecklist(tareaId: number, checklistId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/" + checklistId;
    return this.http.delete(URL, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ========== CHECKLIST ITEMS ==========

  // Añadir un item a un checklist
  addItem(tareaId: number, checklistId: number, item: Partial<ChecklistItem>): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/" + checklistId + "/items";
    
    // Convertir assigned_users de User[] a number[] (solo IDs)
    const payload: any = {
      name: item.name,
      completed: item.completed || false,
      due_date: item.due_date || null
    };
    
    if (item.assigned_users && item.assigned_users.length > 0) {
      payload.assigned_users = item.assigned_users.map(u => u.id);
    }
    
    return this.http.post(URL, payload, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Actualizar un item
  updateItem(tareaId: number, checklistId: number, itemId: number, item: Partial<ChecklistItem>): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/" + checklistId + "/items/" + itemId;
    
    // Convertir assigned_users de User[] a number[] (solo IDs) si existe
    const payload: any = { ...item };
    if (item.assigned_users) {
      payload.assigned_users = item.assigned_users.map(u => typeof u === 'number' ? u : u.id);
    }
    
    return this.http.put(URL, payload, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Eliminar un item
  deleteItem(tareaId: number, checklistId: number, itemId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/" + checklistId + "/items/" + itemId;
    return this.http.delete(URL, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ========== CHECKLIST ITEM MEMBERS (NUEVO) ==========

  // Asignar miembros a un item
  assignMembersToItem(tareaId: number, checklistId: number, itemId: number, userIds: number[]): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/" + checklistId + "/items/" + itemId + "/assign-members";
    return this.http.post(URL, { user_ids: userIds }, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Obtener miembros de un item
  getItemMembers(tareaId: number, checklistId: number, itemId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/" + checklistId + "/items/" + itemId + "/members";
    return this.http.get(URL, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Desasignar un miembro de un item
  unassignMemberFromItem(tareaId: number, checklistId: number, itemId: number, userId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/" + checklistId + "/items/" + itemId + "/unassign-member/" + userId;
    return this.http.delete(URL, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

   /**
   * Obtener todos los checklists de un grupo
   */
  getGroupChecklists(grupoId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/grupos/" + grupoId + "/checklists";
    return this.http.get(URL, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Copiar un checklist existente a una tarea
   */
  copyChecklist(tareaId: number, sourceChecklistId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/copy";
    return this.http.post(URL, { source_checklist_id: sourceChecklistId }, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}