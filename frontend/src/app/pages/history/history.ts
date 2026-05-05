import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product';
import { Chart, registerables } from 'chart.js';
import{RouterLink} from '@angular/router';
Chart.register(...registerables);

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class HistoryComponent implements OnInit {
  private productService = inject(ProductService);

  searches = signal<any[]>([]);
  loading = signal(true);
  selectedProduct = signal<any>(null);
  modalOpen = signal(false);
  loadingChart = signal(false);

  private chart?: Chart;

  ngOnInit() {
    this.productService.getHistory().subscribe({
      next: (data) => {
        this.searches.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.log('error:', err);
        this.loading.set(false);
      }
    });
  }

  openChart(result: any) {
    console.log('openChart llamado:', result.trackedProductId);
    if (!result.trackedProductId) return;

    this.selectedProduct.set(result);
    this.modalOpen.set(true);
    this.loadingChart.set(true);

    this.productService.getProductHistory(result.trackedProductId).subscribe({
      next: (data) => {
        this.loadingChart.set(false);
        setTimeout(() => this.renderChart(data), 100);
      },
      error: () => this.loadingChart.set(false)
    });
  }

  closeModal() {
    this.modalOpen.set(false);
    this.selectedProduct.set(null);
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  renderChart(product: any) {
    const canvas = document.getElementById('priceChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) this.chart.destroy();

    const history = product.priceHistory;
    const labels = history.map((h: any) =>
      new Date(h.recordedAt).toLocaleDateString('es-MX')
    );
    const prices = history.map((h: any) =>
      parseFloat(h.price.replace(/[^0-9.]/g, ''))
    );

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `${product.store} — ${product.title}`,
          data: prices,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          pointRadius: 5,
          tension: 0.3,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => `$${ctx.parsed.y?.toFixed(2) ?? '0.00'} MXN`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { callback: (v) => `$${v}` }
          }
        }
      }
    });
  }
}