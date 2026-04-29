import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductResult {
  title: string;
  price: string;
  description: string;
  image: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient) {}

  compare(urls: string[]): Observable<ProductResult[]> {
  return this.http.post<ProductResult[]>('http://localhost:3000/scrape', { urls });
  }

  getHistory(): Observable<any> {
    return this.http.get('http://localhost:3000/scrape/history');
  }

}