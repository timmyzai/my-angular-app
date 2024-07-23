import { Injectable } from '@angular/core';
import { ResponseDto } from 'src/shared/interfaces';

@Injectable({
    providedIn: 'root'
})
export class FetchService {
    constructor() { }

    fetchGet(url: string, token?: string | null, extraHeaders?: HeadersInit): Promise<ResponseDto> {
        const requestOptions = {
            method: 'GET',
            headers: this.getHeaders(token, extraHeaders)
        };
        return this.fetchWithToken(url, requestOptions);
    }

    fetchPost(url: string, body: any, token?: string | null, extraHeaders?: HeadersInit): Promise<ResponseDto> {
        const requestOptions = {
            method: 'POST',
            headers: this.getHeaders(token, extraHeaders),
            body: JSON.stringify(body)
        };
        return this.fetchWithToken(url, requestOptions);
    }

    fetchDelete(url: string, body: any, token?: string | null, extraHeaders?: HeadersInit): Promise<ResponseDto> {
        const requestOptions = {
            method: 'DELETE',
            headers: this.getHeaders(token, extraHeaders),
            body: JSON.stringify(body)
        };
        return this.fetchWithToken(url, requestOptions);
    }

    fetchPut(url: string, body: any, token?: string | null, extraHeaders?: HeadersInit): Promise<ResponseDto> {
        const requestOptions = {
            method: 'PUT',
            headers: this.getHeaders(token, extraHeaders),
            body: JSON.stringify(body)
        };
        return this.fetchWithToken(url, requestOptions);
    }

    private getHeaders(token?: string | null, extraHeaders?: HeadersInit): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (extraHeaders) {
            Object.assign(headers, extraHeaders);
        }
        return headers;
    }

    private fetchWithToken(url: string, requestOptions: RequestInit): Promise<ResponseDto> {
        return fetch(url, requestOptions)
            .then(response => response.json());
    }
}
