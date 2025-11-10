import { HttpClient } from './http-client.js';

export class BFFService {
  constructor(private httpClient: HttpClient) {}

  async getUserProfile(userId: string) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return this.httpClient.get(`https://dummyjson.com/users/${userId}`);
  }
}
