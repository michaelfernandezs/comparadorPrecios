import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CompareComponent } from "./pages/compare/compare";
import { Navbar } from "./components/navbar/navbar";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CompareComponent, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}