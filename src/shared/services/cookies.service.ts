import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CookiesService {
  getCookieValue(key: string): string | null {
    const cookies = document.cookie.split('; ');
    for (let i = 0; i < cookies.length; i++) {
      const [cookieKey, ...cookieValueParts] = cookies[i].split('=');
      if (cookieKey === key) {
        const cookieValue = cookieValueParts.join('=');
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  }
  setCookieValue(key, value, expiryDate: Date) {
    document.cookie = key + '=' + value + '; expires=' + expiryDate.toUTCString() + '; path=/';
  }

  deleteCookie(key) {
    document.cookie = encodeURIComponent(key) + '=; expires=' + new Date(new Date().getTime() - 86400000).toUTCString();
  }
}
