import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/modules/auth';
import { NotificationService } from 'src/app/services/notification.service';
import { Subscription } from 'rxjs';

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
  
  private subscription: Subscription = new Subscription();

  constructor(
    public authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.user;
    
    // Suscribirse al contador de notificaciones no leídas
    this.subscription.add(
      this.notificationService.unreadCount$.subscribe((count: number) => {
        this.unreadCount = count;
      })
    );

    // Cargar el contador inicial
    this.notificationService.getUnreadCount().subscribe();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}