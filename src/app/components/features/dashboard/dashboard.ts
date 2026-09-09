import { Component } from '@angular/core';
import { Sidenav } from '../sidenav/sidenav';

@Component({
  imports: [Sidenav],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly chartData = [
    { month: 'Jan', payments: 62, receipts: 44 },
    { month: 'Feb', payments: 48, receipts: 58 },
    { month: 'Mar', payments: 74, receipts: 51 },
    { month: 'Apr', payments: 56, receipts: 68 },
    { month: 'May', payments: 84, receipts: 63 },
    { month: 'Jun', payments: 70, receipts: 78 },
  ];
}
