import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AppConsts } from './shared/AppConsts';

@Injectable({
  providedIn: 'root',
})
export class AppInitializer {
  constructor(private http: HttpClient) { }

  private getAppConfig(): Observable<any> {
    return this.http.get<any>('assets/appconfig.json').pipe(
      tap((response) => {
        AppConsts.appBaseUrl = response.appBaseUrl;
        AppConsts.remoteUserServiceBaseUrl = response.remoteUserServiceBaseUrl;
        AppConsts.remoteWalletServiceBaseUrl = response.remoteWalletServiceBaseUrl;
      })
    );
  }
  
  init(): () => Promise<void> {
    return () => this.getAppConfig().toPromise();
  }
  

}
