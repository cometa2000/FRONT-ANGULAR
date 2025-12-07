import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/modules/auth';
import { NotificationService } from 'src/app/services/notification.service';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/modules/profile/service/profile.service';

// Servicio de modo oscuro de Metronic
// import { ThemeModeService } from 'src/app/_metronic/partials/layout/theme-mode-switcher/theme-mode.service';
import { ThemeModeService, ThemeModeType } from 'src/app/_metronic/partials/layout/theme-mode-switcher/theme-mode.service';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() appHeaderDefaulMenuDisplay: boolean = false;
  @Input() isRtl: boolean = false;

  itemClass: string = 'ms-1 ms-lg-3';
  btnClass: string = 'btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px w-md-40px h-md-40px';
  userAvatarClass: string = 'symbol-35px symbol-md-40px';
  btnIconClass: string = 'fs-2 fs-md-1';
  
  user: any;
  unreadCount: number = 0;
  currentThemeIcon: string = 'night-day';

  mode$: Observable<ThemeModeType>;
  menuMode$: Observable<ThemeModeType>;


  private subscription: Subscription = new Subscription();

  constructor(
    public authService: AuthService,
    private notificationService: NotificationService,
    private profileService: ProfileService,
    public themeSwitcher: ThemeModeService,
    
  ) {}

  ngOnInit(): void {
    this.user = this.authService.user;

    /* ==== Notificaciones ==== */
    this.subscription.add(
      this.notificationService.unreadCount$.subscribe((count: number) => {
        this.unreadCount = count;
      })
    );

    this.notificationService.getUnreadCount().subscribe();

    /* ==== Perfil ==== */
    this.subscription.add(
      this.profileService.currentUser$.subscribe((updatedUser) => {
        if (updatedUser) {
          this.user = updatedUser;
        }
      })
    );

    /* ==== AuthService ==== */
    if (this.authService.currentUserSubject) {
      this.subscription.add(
        this.authService.currentUserSubject.subscribe((updatedUser) => {
          if (updatedUser) {
            this.user = updatedUser;
          }
        })
      );
    }

    this.mode$ = this.themeSwitcher.mode.asObservable();
    this.menuMode$ = this.themeSwitcher.menuMode.asObservable();


  }

  /* ==== Alternar tema ==== */
  toggleTheme(): void {
  // Detectar tema actual desde el <html>
  const html = document.documentElement;
  const current = html.getAttribute('data-bs-theme');

  let newMode = 'light';

  if (current === 'light') {
    newMode = 'dark';
  } else {
    newMode = 'light';
  }

  // Cambiar el modo en Metronic
  this.themeSwitcher.updateMode(newMode as any);

  // Actualizar icono manualmente
  this.currentThemeIcon = newMode === 'dark' ? 'moon' : 'sun';
}


  /* ==== Avatar ==== */
  getUserAvatar(): string {
    if (this.user?.avatar) {
      const avatarValue = this.user.avatar;

      if (avatarValue.match(/^\d+\.png$/)) {
        return `assets/media/avatars/${avatarValue}`;
      }

      if (avatarValue.includes('http') || avatarValue.includes('storage')) {
        return avatarValue;
      }

      return `assets/media/avatars/${avatarValue}`;
    }

    return 'assets/media/avatars/1.png';
  }

  ngOnDestroy(): void {
      this.subscription.unsubscribe();
    }


    setTheme(mode: 'light' | 'dark' | 'system'): void {
    this.themeSwitcher.updateMode(mode as any);

    // Actualizar icono
    if (mode === 'light') {
      this.currentThemeIcon = 'sun';
    } else if (mode === 'dark') {
      this.currentThemeIcon = 'moon';
    } else {
      // si el sistema está en modo oscuro
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentThemeIcon = prefersDark ? 'moon' : 'sun';
    }
  }

  switchTheme(mode: ThemeModeType): void {
    this.themeSwitcher.switchMode(mode);
  }

}
