import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/modules/auth';

export interface GanttFilters {
  start_date: string;
  end_date: string;
  filter_type: 'all' | 'workspace' | 'grupo' | 'shared';
  filter_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GanttService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  /**
   * 📊 Obtener datos del Gantt con filtros
   */
  getGanttData(filters: GanttFilters) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    
    // Construir query params
    let params = new URLSearchParams({
      start_date: filters.start_date,
      end_date: filters.end_date,
      filter_type: filters.filter_type,
    });
    
    if (filters.filter_id) {
      params.append('filter_id', filters.filter_id.toString());
    }
    
    let URL = `${URL_SERVICIOS}/gantt/data?${params.toString()}`;
    
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * 🔧 Obtener opciones para filtros (workspaces y grupos)
   */
  getFilterOptions() {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = `${URL_SERVICIOS}/gantt/filter-options`;
    
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}