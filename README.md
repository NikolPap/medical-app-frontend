# MedSync – Frontend

![CI](https://github.com/NikolPap/medical-app-frontend/actions/workflows/ci.yml/badge.svg)

Angular-Frontend für die Terminverwaltung von Arztpraxen.
Backend: [medical-app-backend](https://github.com/NikolPap/medical-app-backend)

> **Demo-Projekt.** Keine echten Patientendaten eingeben.

## Screenshots
<!-- Hier 3–4 Screenshots oder ein GIF einfügen: Login, Patienten-Dashboard, Terminbuchung, Arzt-Dashboard, Admin-Freischaltung -->
![Dashboard](docs/dashboard.png)

## Features
- Rollenbasierte Oberflächen: Patient, Arzt, Admin (Role-Guards)
- Terminbuchung mit Live-Verfügbarkeit: freie Slots kommen direkt aus der Backend-Engine
- Verschieben und Stornieren (48-Stunden-Regel wird im UI berücksichtigt)
- Arzt: Arbeitszeiten, Urlaubsverwaltung, Terminbestätigung
- Admin: Freischaltung neuer Ärzte
- Registrierung mit E-Mail-Verifizierung, Passwort-Reset
- Responsive Design (Sidebar auf Desktop, Bottom-Navigation auf Mobil)
- Eigenes Design-System (Tailwind): Ink Teal, Cool Paper, Warm Brass; Fraunces und Inter

## Tech-Stack
Angular 21 (Standalone Components) · TypeScript · RxJS · Tailwind CSS · PrimeNG ·
JWT-Interceptor und Guards · Docker/nginx · GitHub Actions

## Architektur
- Smart/Dumb-Components: `DashboardComponent` hält den State, kleine Komponenten
  (`AppointmentRow`, `SummaryCards`, ...) bekommen nur `@Input`/`@Output`
- Wiederverwendbare Pipes für Status-Label und -Farben
- `core/` (Services, Guards, Interceptor, Models), `features/` (auth, dashboard, admin, legal), `shared/`

## Starten

Voraussetzung: Backend läuft auf `http://localhost:8080`
([Anleitung](https://github.com/NikolPap/medical-app-backend#starten)).

```bash
npm ci --legacy-peer-deps
npm start            # http://localhost:4200
```# MedSync – Frontend

![CI](https://github.com/NikolPap/medical-app-frontend/actions/workflows/ci.yml/badge.svg)

Angular-Frontend für die Terminverwaltung von Arztpraxen.
Backend: [medical-app-backend](https://github.com/NikolPap/medical-app-backend)

> **Demo-Projekt.** Keine echten Patientendaten eingeben.

## Screenshots
<!-- Hier 3–4 Screenshots oder ein GIF einfügen: Login, Patienten-Dashboard, Terminbuchung, Arzt-Dashboard, Admin-Freischaltung -->
![Dashboard](docs/dashboard.png)

## Features
- Rollenbasierte Oberflächen: Patient, Arzt, Admin (Role-Guards)
- Terminbuchung mit Live-Verfügbarkeit: freie Slots kommen direkt aus der Backend-Engine
- Verschieben und Stornieren (48-Stunden-Regel wird im UI berücksichtigt)
- Arzt: Arbeitszeiten, Urlaubsverwaltung, Terminbestätigung
- Admin: Freischaltung neuer Ärzte
- Registrierung mit E-Mail-Verifizierung, Passwort-Reset
- Responsive Design (Sidebar auf Desktop, Bottom-Navigation auf Mobil)
- Eigenes Design-System (Tailwind): Ink Teal, Cool Paper, Warm Brass; Fraunces und Inter

## Tech-Stack
Angular 21 (Standalone Components) · TypeScript · RxJS · Tailwind CSS · PrimeNG ·
JWT-Interceptor und Guards · Docker/nginx · GitHub Actions

## Architektur
- Smart/Dumb-Components: `DashboardComponent` hält den State, kleine Komponenten
  (`AppointmentRow`, `SummaryCards`, ...) bekommen nur `@Input`/`@Output`
- Wiederverwendbare Pipes für Status-Label und -Farben
- `core/` (Services, Guards, Interceptor, Models), `features/` (auth, dashboard, admin, legal), `shared/`

## Starten

Voraussetzung: Backend läuft auf `http://localhost:8080`
([Anleitung](https://github.com/NikolPap/medical-app-backend#starten)).

```bash
npm ci --legacy-peer-deps
npm start            # http://localhost:4200
```

Mit Docker:
```bash
docker build -t medsync-frontend .
docker run --rm -p 4200:80 medsync-frontend
```

Frontend und Backend zusammen: `docker compose -f docker-compose.full.yml up --build`
im Backend-Repo (beide Repos in benachbarten Ordnern).

## Entscheidungen
- **Smart/Dumb-Split:** Das Dashboard-Template schrumpfte von ~450 auf ~55 Zeilen.
- **Token im localStorage:** einfach für eine SPA; bekanntes XSS-Risiko, Alternative wäre ein httpOnly-Cookie.
- **Role-Guard prüft auch `exp`:** abgelaufene Tokens führen zum Login statt zu 401-Fehlern.
