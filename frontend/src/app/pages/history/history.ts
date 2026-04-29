import { Component, OnInit, signal,inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class HistoryComponent implements OnInit {
  private productService = inject(ProductService);
  
  searches = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.productService.getHistory().subscribe({
      next: (data) => {
        this.searches.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}