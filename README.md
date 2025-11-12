# QuickCart E-commerce Backend API

## 🚀 Descripción

**QuickCart** es una plataforma de e-commerce moderna desarrollada con **NestJS**, **TypeORM** y **PostgreSQL** (Supabase). El proyecto sigue principios de **Clean Architecture**, **SOLID** y mejores prácticas de **DevSecOps** orientadas a OWASP Top 10.

### ⚡ Características Principales

- **Arquitectura Limpia:** Separación clara entre capas de dominio, aplicación e infraestructura
- **Seguridad First:** Validación rigurosa, sanitización de datos y protección OWASP
- **TypeScript:** Tipado fuerte y desarrollo orientado a tipos
- **Testing:** Cobertura mínima del 80% con Jest
- **PostgreSQL:** Base de datos ACID confiable con TypeORM
- **Documentación API:** Swagger/OpenAPI automático
- **Docker Ready:** Containerización lista para producción

## 🛠️ Stack Tecnológico

| Tecnología     | Versión | Propósito           |
| -------------- | ------- | ------------------- |
| **Node.js**    | 18+     | Runtime             |
| **NestJS**     | 10.x    | Framework backend   |
| **TypeScript** | 5.x     | Lenguaje principal  |
| **TypeORM**    | 0.3.x   | ORM para PostgreSQL |
| **PostgreSQL** | 15+     | Base de datos       |
| **Jest**       | 29.x    | Testing framework   |
| **Swagger**    | 7.x     | Documentación API   |
| **Docker**     | Latest  | Containerización    |

## 🚦 Inicio Rápido

### Prerequisitos

- **Node.js** 18+
- **npm** 9+
- **PostgreSQL** 15+ (o cuenta Supabase)
- **Docker** (opcional)

### 1. Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd quickcart-ecom-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### 2. Configuración de Base de Datos

#### Opción A: Supabase (Recomendado)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Obtener credenciales de conexión
3. Actualizar `.env` con los datos de Supabase

#### Opción B: PostgreSQL Local

```bash
# Usando Docker Compose
docker-compose up postgres -d

# O instalar PostgreSQL manualmente
# y crear base de datos 'quickcart-db'
```

### 3. Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Con Docker
docker-compose up
```

## 📝 Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3000

# Database (Supabase)
DATABASE_HOST=your-supabase-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=quickcart-db
DATABASE_URL=postgresql://user:pass@host:5432/db

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12

# API Configuration
CORS_ORIGIN=http://localhost:3001
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

## 🏗️ Arquitectura del Proyecto

```
src/
├── domain/           # Entidades y reglas de negocio
│   ├── entities/     # Entidades TypeORM
│   └── interfaces/   # Contratos de dominio
├── application/      # Casos de uso y DTOs
│   ├── services/     # Lógica de aplicación
│   └── dto/          # Data Transfer Objects
├── infrastructure/   # Implementaciones externas
│   ├── database/     # Configuración TypeORM
│   └── repositories/ # Implementación de repositorios
├── presentation/     # Controladores y APIs
│   └── controllers/  # Endpoints REST
└── shared/          # Utilidades compartidas
    ├── config/      # Configuraciones
    ├── dto/         # DTOs base
    └── utils/       # Utilidades comunes
```

### Principios Aplicados

- **Single Responsibility (SRP):** Cada clase tiene una única responsabilidad
- **Open/Closed (OCP):** Extensible sin modificar código existente
- **Liskov Substitution (LSP):** Subclases reemplazables por clases base
- **Interface Segregation (ISP):** Interfaces específicas y cohesivas
- **Dependency Inversion (DIP):** Dependencia de abstracciones, no implementaciones

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests unitarios en modo watch
npm run test:watch

# Tests E2E
npm run test:e2e

# Cobertura de código
npm run test:cov
```

### Estructura de Tests

- **Unitarios:** `src/**/*.spec.ts`
- **E2E:** `test/**/*.e2e-spec.ts`
- **Cobertura mínima:** 80%

## 📊 Base de Datos

### Migraciones

```bash
# Generar migración
npm run migration:generate

# Ejecutar migraciones
npm run migration:run

# Revertir migración
npm run migration:revert
```

### Entidades Base

Todas las entidades extienden de `BaseEntity`:

```typescript
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

## 🔒 Seguridad (OWASP)

### Medidas Implementadas

- **A03 - Injection:** Validación estricta con `class-validator`
- **A04 - Insecure Design:** Rate limiting y validación de schemas
- **A05 - Security Misconfiguration:** Configuración validada con Joi
- **A06 - Vulnerable Components:** Dependencias actualizadas regularmente
- **A07 - Authentication:** JWT con expiración configurable

### Headers de Seguridad

```typescript
// Helmet configurado en main.ts
app.use(
  helmet({
    contentSecurityPolicy: {
      /* ... */
    },
    // Más configuraciones de seguridad
  }),
);
```

## 📚 API Documentación

- **Swagger UI:** `http://localhost:3000/api/docs`
- **Health Check:** `http://localhost:3000/api/v1`

### Autenticación API

```bash
# Ejemplo de request autenticado
curl -H "Authorization: Bearer <JWT_TOKEN>" \
     http://localhost:3000/api/v1/users/profile
```

## 🐳 Docker

### Desarrollo

```bash
# Todas las dependencias
docker-compose up

# Solo base de datos
docker-compose up postgres redis
```

### Producción

```bash
# Build imagen
docker build -t quickcart-api .

# Ejecutar contenedor
docker run -p 3000:3000 quickcart-api
```

## 📋 Scripts Disponibles

| Script               | Descripción                    |
| -------------------- | ------------------------------ |
| `npm run start:dev`  | Desarrollo con hot-reload      |
| `npm run build`      | Compilar para producción       |
| `npm run start:prod` | Ejecutar versión de producción |
| `npm run test`       | Tests unitarios                |
| `npm run test:e2e`   | Tests end-to-end               |
| `npm run lint`       | Análisis de código             |
| `npm run format`     | Formatear código               |

## 🔧 Configuración IDE

### VS Code (Recomendado)

Extensiones sugeridas:

- **NestJS Files**
- **TypeScript Importer**
- **Thunder Client** (testing API)
- **Docker**
- **PostgreSQL**

## 🤝 Contribución

### Flujo de Desarrollo

1. **Fork** del repositorio
2. **Crear rama** feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commits** descriptivos: `git commit -m "feat: agregar autenticación JWT"`
4. **Tests** obligatorios con cobertura >= 80%
5. **Pull Request** con descripción detallada

### Convenciones de Código

- **Naming:** camelCase para variables, PascalCase para clases
- **Files:** kebab-case para archivos, `.entity.ts`, `.service.ts`, `.controller.ts`
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)

## 🚀 Roadmap

### Fase 1 - MVP (Actual)

- [x] Setup base con NestJS + TypeORM
- [x] Autenticación y autorización
- [x] CRUD básico de productos
- [x] Sistema de órdenes

### Fase 2 - Características Avanzadas

- [ ] Microservicios con NestJS
- [ ] Cache con Redis
- [ ] Search con Elasticsearch
- [ ] Notifications en tiempo real
- [ ] File uploads con S3

### Fase 3 - Escalabilidad

- [ ] Kubernetes deployment
- [ ] Monitoring con Prometheus
- [ ] Logging distribuido
- [ ] CI/CD con GitHub Actions

## 📄 Licencia

Este proyecto es privado y propietario. Todos los derechos reservados.

## 👥 Equipo

- **Desarrollador Principal:** [Tu Nombre]
- **Arquitecto de Seguridad:** [Nombre]
- **DevOps Engineer:** [Nombre]

## 📞 Soporte

- **Issues:** GitHub Issues
- **Email:** quickcart-support@company.com
- **Documentación:** [Wiki del proyecto]

---

**🎯 ¡QuickCart - E-commerce del Futuro!** 🛒✨
