# GenomePrioritizer

Genomic variant prioritization platform for clinical teams.

## Quick start

```bash
cd genomic-prioritizer
docker-compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

First boot takes ~3–5 minutes (builds images + seeds database).

## Demo accounts (password: `password123`)

| Username      | Team          | Role   |
|---------------|---------------|--------|
| dr.chen       | Oncology      | Admin  |
| dr.park       | Oncology      | Editor |
| nurse.davis   | Oncology      | Viewer |
| dr.torres     | Rare Disease  | Admin  |
| dr.wong       | Rare Disease  | Editor |
| dr.adams      | Cardiology    | Admin  |
| dr.liu        | Cardiology    | Editor |
| nurse.brown   | Rare Disease  | Viewer |

## Features

- Login → patient list (searchable, filterable by team)
- Click patient → Studies tab + Variants tab
- Filter variants by gene name or chromosome
- Mark variants: Important / Low Priority / Avoid
- Add shared team notes per variant
- Audit trail of all priority changes
- Download PDF report (important variants + notes) per patient or all patients
