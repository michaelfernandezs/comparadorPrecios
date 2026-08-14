import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

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

  searchByName(query: string): Observable<ProductResult[]> {
    return this.http.post<ProductResult[]>(`${API}/search`, { query });
  }

  getHistory(): Observable<any> {
    return this.http.get(`${API}/history`);
  }

  getProductHistory(id: number): Observable<any> {
    return this.http.get(`${API}/history/${id}`);
  }
  getPriceDrops(): Observable<any[]> {
  return this.http.get<any[]>(`${API}/price-drops`);
}
}