import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/modules/auth';

export interface ChecklistItem {
  id?: number;
  name: string;
  completed: boolean;
  checklist_id?: number;
  orden?: number;
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
  addItem(tareaId: number, checklistId: number, item: ChecklistItem): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/" + checklistId + "/items";
    return this.http.post(URL, item, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Actualizar un item
  updateItem(tareaId: number, checklistId: number, itemId: number, item: Partial<ChecklistItem>): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    let URL = URL_SERVICIOS + "/tareas/" + tareaId + "/checklists/" + checklistId + "/items/" + itemId;
    return this.http.put(URL, item, { headers: headers }).pipe(
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
}