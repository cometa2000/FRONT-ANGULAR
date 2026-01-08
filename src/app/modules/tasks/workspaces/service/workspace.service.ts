import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/modules/auth';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  // ✅ SOLUCIÓN PROBLEMAS 1 y 2: BehaviorSubject para notificar cambios en workspaces
  private workspacesChangedSubject = new BehaviorSubject<boolean>(false);
  public workspacesChanged$ = this.workspacesChangedSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  /**
   * ✅ Notificar que los workspaces han cambiado
   */
  notifyWorkspacesChanged() {
    console.log('📢 WorkspaceService: Notificando cambios en workspaces');
    this.workspacesChangedSubject.next(true);
  }

  /**
   * 📝 Crear un nuevo espacio de trabajo
   */
  registerWorkspace(data: any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + "/workspaces";
    return this.http.post(URL, data, {headers: headers}).pipe(
      finalize(() => {
        this.isLoadingSubject.next(false);
        // ✅ SOLUCIÓN PROBLEMA 2: Notificar después de crear
        this.notifyWorkspacesChanged();
      })
    );
  }

  /**
   * 📋 Listar todos los espacios de trabajo del usuario
   */
  listWorkspaces(search: string = '') {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + "/workspaces?search=" + search;
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * 🔍 Obtener un espacio de trabajo específico con sus grupos
   */
  getWorkspace(workspaceId: number) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + "/workspaces/" + workspaceId;
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * ✏️ Actualizar espacio de trabajo
   */
  updateWorkspace(workspaceId: number, data: any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + "/workspaces/" + workspaceId;
    return this.http.put(URL, data, {headers: headers}).pipe(
      finalize(() => {
        this.isLoadingSubject.next(false);
        // ✅ Notificar después de actualizar
        this.notifyWorkspacesChanged();
      })
    );
  }

  /**
   * 🗑️ Eliminar espacio de trabajo
   */
  deleteWorkspace(workspaceId: number) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + "/workspaces/" + workspaceId;
    return this.http.delete(URL, {headers: headers}).pipe(
      finalize(() => {
        this.isLoadingSubject.next(false);
        // ✅ Notificar después de eliminar
        this.notifyWorkspacesChanged();
      })
    );
  }

  /**
   * 📁 Obtener grupos de un workspace específico
   */
  getWorkspaceGroups(workspaceId: number, search: string = '') {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/workspaces/${workspaceId}/grupos?search=${search}`;
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * 🔄 Mover un grupo a otro workspace
   */
  moveGroupToWorkspace(grupoId: number, workspaceId: number) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}/move`;
    return this.http.post(URL, { workspace_id: workspaceId }, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * 📊 Obtener estadísticas del workspace
   */
  getWorkspaceStats(workspaceId: number) {
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/workspaces/${workspaceId}/stats`;
    return this.http.get(URL, {headers: headers});
  }
}