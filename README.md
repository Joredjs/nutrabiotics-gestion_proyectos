# Sistema de Gestión de Proyectos - Nutrabiotics

## 📋 Información General

**Candidato**: Jorge Eduardo Garay Gutiérrez  
**Posición**: Desarrollador Fullstack Senior  
**Empresa**: Nutrabiotics  
**Duración**: 3 días

### 🎯 Objetivo del Proyecto

Desarrollar una plataforma web completa para gestionar proyectos de desarrollo de software con autenticación robusta, roles de usuario, CRUD completo, notificaciones en tiempo real y arquitectura escalable.

---

## 🏗️ Arquitectura del Proyecto

### Monorepo con Nx

Se eligió **Nx** como gestor de monorepo para:

- Compartir tipos y utilidades entre backend y frontend
- Gestión unificada de dependencias
- Facilitar el desarrollo full-stack
- Escalabilidad futura para microservicios

### Stack Tecnológico

**Backend:**

- **NestJS**: Framework robusto con decoradores, IoC y TypeScript nativo
- **Prisma**: ORM moderno con type-safety y migraciones automáticas
- **PostgreSQL**: Base de datos relacional robusta
- **JWT**: Autenticación stateless con refresh tokens

**Frontend:**

- **React 19**: Última versión con nuevas características
- **TypeScript**: Type-safety en todo el frontend
- **Tailwind CSS**: Utility-first para desarrollo rápido
- **React Query**: Gestión de estado servidor optimizada
- **Zustand**: Estado global ligero y simple

## 🏛️ Decisiones de Arquitectura

### 1. Estructura de Carpetas

```
apps/
├── api/           # Backend NestJS
├── web/           # Frontend React
libs/
├── shared-types/  # Tipos compartidos
├── shared-utils/  # Utilidades compartidas
```

### 2. Patrón Repository

Implementé el patrón Repository para:

- Abstraer la lógica de datos
- Facilitar testing con mocks
- Posible cambio de ORM en el futuro
- Separación clara de responsabilidades

### 3. Validación en Múltiples Capas

- **Frontend**: React Hook Form + Zod
- **Backend**: Class-validator en DTOs
- **Base de datos**: Constrains de Prisma

### 4. Manejo de Errores Centralizado

- Filtro global de excepciones en NestJS
- Interceptor de errores en Axios
- Toasts consistentes en el frontend

## 🔐 Seguridad Implementada

### Autenticación JWT

- Access tokens de corta duración (15 min)
- Refresh tokens de larga duración (7 días)
- Rotación automática de tokens
- Logout con invalidación de tokens

### Autorización por Roles

- **ADMIN**: Acceso total
- **MANAGER**: Gestión de proyectos y usuarios
- **DEVELOPER**: Solo tareas asignadas

### Guards y Middleware

- JWT Guard en todas las rutas protegidas
- Roles Guard para control granular
- Validación en cada endpoint

## 📊 Base de Datos

### Modelo Relacional

```
User (1:N) Project (manager)
User (N:M) Project (developers via ProjectDeveloper)
Project (1:N) Task
User (1:N) Task (assignee)
```

### Soft Delete

Implementado en modelos críticos para:

- Auditoría de datos
- Recuperación accidental
- Integridad referencial

## 🎨 Frontend - Decisiones UX/UI

### Responsive Design

- Mobile-first approach
- Sidebar colapsable
- Grids adaptativas

### Estado Global

- **Zustand** para autenticación (persiste en localStorage)
- **React Query** para estado servidor (caché inteligente)
- Estado local con useState para UI

### Componentes Reutilizables

- Modales genéricos
- Cards consistentes
- Loading states uniformes
- Error boundaries

## 🧪 Testing

### Backend (Implementado)

- Tests unitarios de servicios
- Tests de controladores
- Mocks de repositorios
- Coverage > 80%

### Frontend (Pendiente por tiempo)

- Tests de componentes con Testing Library
- Tests de integración con MSW
- E2E con Cypress

## 🐳 DevOps

### Containerización

```dockerfile
# Multi-stage builds para optimización
FROM node:20-alpine AS builder
# Build process...
FROM node:20-alpine AS runner
# Runtime optimizado
```

### Scripts de Desarrollo

```json
{
  "dev": "Ambos servicios en paralelo",
  "setup": "Instalación completa automatizada",
  "db:*": "Comandos de base de datos"
}
```

## 🚀 Setup Local

### Prerrequisitos

- Node.js 20+
- Docker y Docker Compose
- Git

### Instalación Rápida

```bash
git clone <repository>
cd nutrabiotics-system
npm run setup
```

Este comando:

1. Instala dependencias
2. Levanta PostgreSQL y Redis
3. Ejecuta migraciones
4. Siembra datos de prueba
5. Inicia ambos servicios

### Variables de Entorno

```env
# Backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/project_management"
JWT_SECRET="LA LLAVE SECRETA"
JWT_REFRESH_SECRET="EL REFRERSHTOKEN SECRETO"
FRONTEND_URL="http://localhost:4200"

# Frontend
API_URL="http://localhost:3333/api"
```

## 👥 Usuarios de Prueba

| Rol | Email | Password | Permisos |
|-----|-------|----------|----------|
| Admin | <admin@test.com> | password123 | Todos |
| Manager | <manager@test.com> | password123 | Proyectos y usuarios |
| Developer | <dev@test.com> | password123 | Tareas asignadas |

## 🔄 Flujos Principales

### 1. Gestión de Proyectos

- Admin/Manager crea proyecto
- Asigna desarrolladores
- Define fechas y prioridades
- Seguimiento de progreso

### 2. Gestión de Tareas

- Cualquier rol puede crear tareas
- Asignación solo a desarrolladores del proyecto
- Estados: TODO → IN_PROGRESS → REVIEW → DONE
- Estimación vs tiempo real

### 3. Dashboard y Métricas

- Resumen personalizado por rol
- Estadísticas de tareas y proyectos
- Progreso visual

## 🎯 APIs Implementadas (15+ Endpoints)

### Documentación Swagger Automática

**Acceso**: `http://localhost:3333/api/docs`

### Endpoints por Módulo

#### 🔐 Authentication

```http
POST   /api/auth/register     # Registro de usuarios
POST   /api/auth/login        # Login con email/password  
GET    /api/auth/profile      # Perfil del usuario actual
POST   /api/auth/refresh      # Renovar access token
POST   /api/auth/logout       # Logout y revoke tokens
```

#### 👥 Users Management

```http
GET    /api/users             # Lista paginada + filtros (Admin/Manager)
POST   /api/users             # Crear usuario (Admin/Manager)
GET    /api/users/developers  # Developers para asignación
GET    /api/users/me          # Perfil propio
GET    /api/users/me/stats    # Estadísticas personales
GET    /api/users/:id         # Usuario específico
PATCH  /api/users/:id         # Actualizar usuario
DELETE /api/users/:id         # Soft delete (Admin)
```

#### 📋 Projects Management

```http
GET    /api/projects          # Proyectos (filtrado por rol)
POST   /api/projects          # Crear proyecto (Admin/Manager)
GET    /api/projects/:id      # Proyecto específico + tareas
GET    /api/projects/:id/stats # Estadísticas del proyecto
PATCH  /api/projects/:id      # Actualizar proyecto
DELETE /api/projects/:id      # Eliminar proyecto (Admin)
```

#### ✅ Tasks Management

```http
GET    /api/tasks             # Todas las tareas (filtrado por rol)
POST   /api/tasks             # Crear tarea
GET    /api/tasks/my-tasks    # Mis tareas asignadas
GET    /api/tasks/:id         # Tarea específica
PATCH  /api/tasks/:id         # Actualizar tarea
PATCH  /api/tasks/:id/status  # Cambiar status (para Kanban)
DELETE /api/tasks/:id         # Eliminar tarea

# Project-specific tasks
GET    /api/projects/:id/tasks    # Tareas de un proyecto
POST   /api/projects/:id/tasks    # Crear tarea en proyecto
```

## 🎯 Limitaciones Conocidas

### Por Tiempo de Desarrollo

1. **WebSockets**: No implementado (estimado 1 día)
2. **CI/CD**: GitHub Actions pendiente (0.5 días)
3. **Deploy**: Solo configuración local (0.5 días)
4. **Tests Frontend**: Cobertura limitada (1 día)

### Próximas Mejoras

- Notificaciones en tiempo real
- Sistema de comentarios
- Exportación de reportes
- Tema dark/light
- Búsqueda avanzada

## 📈 Escalabilidad

### Preparado Para

- Microservicios (separación por dominio)
- Cache con Redis (ya configurado)
- CDN para assets estáticos
- Horizontal scaling del API

### Monitoreo

- Logs estructurados
- Health checks implementados
- Métricas de performance listas

## 🔄 Proceso de Desarrollo

### Metodología por Ramas Especializadas

Para optimizar el tiempo de desarrollo, se utilizó una estrategia de ramas especializadas:

```markdown
main
├── core/structure     # Setup inicial Nx + estructura base
├── backend           # Desarrollo completo API NestJS  
└── frontend          # Implementación completa React UI
```

### Cronología de Commits

```bash
# Día 1: Estructura
36e5768 - core: first commit
4728d29 - chore: nx installation setup
c8838f4 - chore: create backend apps
f86fec7 - chore: create frontend apps
e977dab - chore: create libs

# Día 2: Backend Core
c18db4c - feat(types): adding shared types
1fc7efb - feat(utils): adding shared utils
9ef08e7 - feat(auth): adding auth an db module
987ae70 - feat(projects): adding projects module
15488b6 - feat(users): adding users module
1bbf22e - feat(tasks): adding tasks modules

# Día 3: Testing & Scripts
4b07de2 - build: creating project scripts
94da3cc - test(api): adding testing for api app
7d54b13 - wip: use repository pattern
01bede3 - feat(web): frontend web last version
```

### Estrategia de Desarrollo

1. **Setup**: Nx workspace + estructura monorepo
2. **Backend First**: API completa antes del frontend
3. **Librerias compatidas**: Types y utils para consistencia
4. **Testing**: Tests durante desarrollo backend
5. **Frontend**: UI con tipos ya definidos

### Beneficios del Enfoque

- **Velocidad**: Sin merge conflicts, desarrollo lineal
- **Consistencia**: Shared libs garantizan compatibilidad
- **Enfoque**: Una tecnología a la vez
- **Caldiad**: Testing integrado en cada fase

## 🏆 Aspectos Destacados

1. **Tipado seguro**: TypeScript en todo el stack
2. **Codigo Compartido**: Tipos y utilidades compartidas
3. **Experiencia en desarrollo**: Setup automatizado en 1 comando
4. **Validaciones**: Manejo de errores, validación, seguridad
5. **Escalable**: Arquitectura clara y documentada
6. **Proceso**: Metodología eficiente por ramas especializadas

---

**Tiempo de desarrollo**: 2 días
**LOC**: ~15,000 líneas
**Coverage**: Backend 80%+

Este proyecto demuestra capacidad para crear aplicaciones full-stack robustas, escalables y mantenibles con buenas prácticas , optimizando el proceso de desarrollo para máxima eficiencia.
