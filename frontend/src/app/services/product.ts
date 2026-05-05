import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductResult {
  title: string;
  price: string;
  description: string;
  image: string;
  store: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient) {}

  compare(urls: string[]): Observable<ProductResult[]> {
  return this.http.post<ProductResult[]>('https://empowering-healing-production-a1c8.up.railway.app/scrape', { urls });
  }

  getHistory(): Observable<any> {
    return this.http.get('https://empowering-healing-production-a1c8.up.railway.app/scrape/history');
  }
getProductHistory(id: number): Observable<any> {  
  return this.http.get(`https://empowering-healing-production-a1c8.up.railway.app/scrape/history/${id}`);
}
}