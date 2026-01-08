import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/modules/auth';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  registerGrupo(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/grupos";
    return this.http.post(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  listGrupos(page = 1,search:string = ''){
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/grupos?page="+page+"&search="+search;
    return this.http.get(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ✅ NUEVO: Obtener un grupo específico por ID
  getGrupo(grupoId: number) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}`;
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateGrupo(ID_GRUPO:string,data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/grupos/"+ID_GRUPO;
    return this.http.put(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteGrupo(ID_GRUPO:string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/grupos/"+ID_GRUPO;
    return this.http.delete(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ⭐ Marcar/Desmarcar grupo
  toggleStar(grupoId: number) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}/toggle-star`;
    return this.http.post(URL, {}, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // 📤 Compartir grupo con usuarios
  shareGrupo(grupoId: number, userIds: number[]) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}/share`;
    return this.http.post(URL, { user_ids: userIds }, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // 🔍 Buscar usuarios
  searchUsers(search: string = '') {
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/users/search?search=${search}`;
    return this.http.get(URL, {headers: headers});
  }

  // ❌ Dejar de compartir
  unshareGrupo(grupoId: number, userId: number) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}/unshare/${userId}`;
    return this.http.delete(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getSharedUsers(grupoId: number) {
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}/shared-users`;
    return this.http.get(URL, {headers: headers});
  }

  // Obtener permisos del grupo
  getPermissions(grupoId: number) {
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}/permissions`;
    return this.http.get(URL, {headers: headers});
  }

  // Actualizar tipo de permiso general
  updatePermissionType(grupoId: number, permissionType: string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}/permissions/type`;
    return this.http.post(URL, { permission_type: permissionType }, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Actualizar permiso de usuario específico
  updateUserPermission(grupoId: number, userId: number, permissionLevel: string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}/permissions/user/${userId}`;
    return this.http.post(URL, { permission_level: permissionLevel }, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Actualizar permisos en lote
  batchUpdateUserPermissions(grupoId: number, users: any[]) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}/permissions/batch`;
    return this.http.post(URL, { users: users }, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Verificar acceso de escritura
  checkWriteAccess(grupoId: number) {
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/grupos/${grupoId}/check-write-access`;
    return this.http.get(URL, {headers: headers});
  }
}