
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

  urls: string[] = ['', '', ''];
  loading = signal(false);
  error = signal('');
  results = signal<ProductResult[]>([]);

  canCompare(): boolean {
    return this.urls.filter(u => u.trim().startsWith('http')).length >= 1;
  }
getLabel(i: number): string {
  const labels = ['Tienda 1', 'Tienda 2', 'Tienda 3'];
  return labels[i] ?? `Tienda ${i + 1}`;
}
  getEmoji(url: string): string {
    if (url.includes('mercadolibre')) return '🛒';
    if (url.includes('amazon')) return '📦';
    if (url.includes('liverpool')) return '🛍️';
    return '🌐';
  }

  compare() {
    const validUrls = this.urls.filter(u => u.trim().startsWith('http'));
    this.loading.set(true);
    this.error.set('');
    this.results.set([]);

    this.productService.compare(validUrls).subscribe({
      next: (data: ProductResult[]) => {
        this.results.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set('Error al conectar con el servidor');
        this.loading.set(false);
      }
    });
  }
getPlaceholder(i: number): string {
  const hints = [
    'https://www.mercadolibre.com.mx/...',
    'https://www.amazon.com.mx/...',
    'https://www.liverpool.com.mx/...',
  ];
  return hints[i] ?? 'https://...';
}

onImgError(event: Event) {
  (event.target as HTMLImageElement).src = '';
}
  clearAll() {
    this.urls = ['', '', ''];
    this.results.set([]);
    this.error.set('');
  }
}