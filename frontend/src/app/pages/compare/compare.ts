import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, ProductResult } from '../../services/product';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compare.html',
  styleUrl: './compare.css'
})
export class CompareComponent {
  private productService = inject(ProductService);

  query = '';
  loading = signal(false);
  error = signal('');
  results = signal<ProductResult[]>([]);

  canSearch(): boolean {
    return this.query.trim().length >= 3;
  }

  search() {
    if (!this.canSearch()) return;
    this.loading.set(true);
    this.error.set('');
    this.results.set([]);

    this.productService.searchByName(this.query).subscribe({
      next: (data: ProductResult[]) => {
        this.results.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al conectar con el servidor');
        this.loading.set(false);
      }
    });
  }

  clearAll() {
    this.query = '';
    this.results.set([]);
    this.error.set('');
  }
}