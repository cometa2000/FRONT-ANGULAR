import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { TranslationService } from '../../../../../../modules/i18n';
import { AuthService, UserType } from '../../../../../../modules/auth';
import { ProfileService } from 'src/app/modules/profile/service/profile.service';

@Component({
  selector: 'app-user-inner',
  templateUrl: './user-inner.component.html',
})
export class UserInnerComponent implements OnInit, OnDestroy {
  @HostBinding('class')
  class = `menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px`;
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';

  language: LanguageFlag;
  user$: Observable<any>;
  langs = languages;
  user: any;
  userAvatarClass: string = 'symbol-35px symbol-md-40px';
  private unsubscribe: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private translationService: TranslationService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.user$ = this.auth.currentUserSubject.asObservable();
    this.setLanguage(this.translationService.getSelectedLanguage());

    // ⭐ NUEVO: Suscribirse al usuario actual
    const userSub = this.user$.subscribe((user) => {
      if (user) {
        // console.log('🔄 UserInner detectó cambio de usuario:', user);
        this.user = user;
      }
    });
    this.unsubscribe.push(userSub);

    // ⭐ NUEVO: También suscribirse a cambios en ProfileService
    const profileUserSub = this.profileService.currentUser$.subscribe((updatedUser) => {
      if (updatedUser) {
        // console.log('🔄 UserInner detectó cambio de usuario desde ProfileService:', updatedUser);
        this.user = updatedUser;
      }
    });
    this.unsubscribe.push(profileUserSub);
  }

  logout() {
    this.auth.logout();
    document.location.reload();
  }

  selectLanguage(lang: string) {
    this.translationService.setLanguage(lang);
    this.setLanguage(lang);
  }

  setLanguage(lang: string) {
    this.langs.forEach((language: LanguageFlag) => {
      if (language.lang === lang) {
        language.active = true;
        this.language = language;
      } else {
        language.active = false;
      }
    });
  }

  getUserAvatar(): string {
    if (this.user?.avatar) {
      const avatarValue = this.user.avatar;
      
      // Si ya es solo el nombre del archivo (ejemplo: "3.png")
      if (avatarValue.match(/^\d+\.png$/)) {
        return `assets/media/avatars/${avatarValue}`;
      }
      
      // Si contiene la ruta completa, usarla tal cual (retrocompatibilidad)
      if (avatarValue.includes('http') || avatarValue.includes('storage')) {
        return avatarValue;
      }
      
      // Si no coincide, intentar construir la ruta
      return `assets/media/avatars/${avatarValue}`;
    }
    
    // Avatar por defecto
    return 'assets/media/avatars/1.png';
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}

interface LanguageFlag {
  lang: string;
  name: string;
  flag: string;
  active?: boolean;
}

const languages = [
  {
    lang: 'en',
    name: 'English',
    flag: './assets/media/flags/united-states.svg',
  },
  {
    lang: 'zh',
    name: 'Mandarin',
    flag: './assets/media/flags/china.svg',
  },
  {
    lang: 'es',
    name: 'Spanish',
    flag: './assets/media/flags/spain.svg',
  },
  {
    lang: 'ja',
    name: 'Japanese',
    flag: './assets/media/flags/japan.svg',
  },
  {
    lang: 'de',
    name: 'German',
    flag: './assets/media/flags/germany.svg',
  },
  {
    lang: 'fr',
    name: 'French',
    flag: './assets/media/flags/france.svg',
  },
];