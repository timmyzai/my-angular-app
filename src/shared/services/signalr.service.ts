import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
    providedIn: 'root'
})
export class SignalrService {
    private hubConnection: signalR.HubConnection | undefined;

    constructor() { }

    public startConnection = () => {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl('https://bytebanknotisapi.workinjupiter.club/usermessageHub')
            // .withUrl('http://localhost:7185/usermessageHub')
            .build();

        this.hubConnection
            .start()
            .then(() => console.log('Connection Started!'))
            .catch(err => console.error('Error while starting connection: ' + err));
    }

    public registerUser(userId: string) {
        if (this.hubConnection) {
            this.hubConnection.invoke('RegisterUser', userId)
                .catch(err => console.error('Error while registering user: ' + err));
        }
    }
}
