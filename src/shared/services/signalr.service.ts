import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
    providedIn: 'root'
})
export class SignalrService {
    private hubConnection: signalR.HubConnection | undefined;

    constructor() { }

    public startConnection = (): Promise<void> => {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl('http://localhost:7185/usermessageHub')
            .build();

        return this.hubConnection
            .start()
            .then(() => console.log('Connection Started!'))
            .catch(err => {
                console.error('Error while starting connection: ' + err);
                throw err; // Rethrow to ensure the error is propagated
            });
    }

    public registerUser(userId: string) {
        if (this.hubConnection) {
            this.hubConnection.invoke('RegisterUser', userId)
                .catch(err => console.error('Error while registering user: ' + err));
        }
    }
}
