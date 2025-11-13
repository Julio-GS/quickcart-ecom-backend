# QuickCart E-commerce Backend

## � Descripción

API RESTful robusta para plataforma de e-commerce desarrollada con tecnologías empresariales modernas. Implementa principios de Clean Architecture, SOLID y estándares de seguridad OWASP.

## 🛠️ Stack Tecnológico

- **Framework:** NestJS 10.x con TypeScript
- **ORM:** TypeORM con PostgreSQL
- **Seguridad:** JWT, bcrypt, validación de esquemas
- **Documentación:** Swagger/OpenAPI
- **Testing:** Jest con cobertura >80%

## ✨ Características

### Arquitectura

- **Clean Architecture** con separación de capas
- **Repository Pattern** para abstracción de datos
- **Dependency Injection** con IoC container
- **SOLID Principles** aplicados consistentemente

### Seguridad

- Autenticación JWT con refresh tokens
- Autorización basada en roles (RBAC)
- Validación exhaustiva de entrada de datos
- Rate limiting y headers de seguridad
- Cumplimiento OWASP Top 10

### API Features

- Endpoints RESTful con paginación
- Filtrado y búsqueda avanzada
- Documentación interactiva con Swagger
- Manejo de errores estructurado
- Logging y monitoreo

## 🏗️ Estructura del Proyecto

```
src/
├── domain/           # Entidades y lógica de negocio
├── application/      # Casos de uso y DTOs
├── infrastructure/   # Implementaciones externas
└── shared/           # Utilidades compartidas
```

## 🚀 Instalación y Desarrollo

### Requisitos Previos

- Node.js 18+
- PostgreSQL 15+
- npm 9+

### Configuración

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# Ejecutar migraciones
npm run migration:run

# Iniciar servidor de desarrollo
npm run start:dev
```

### Variables de Entorno

Configurar en archivo `.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost/quickcart_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## 📚 Documentación API

- **Swagger UI:** `http://localhost:3000/api/docs`
- **Health Check:** `http://localhost:3000/api/v1`

### Módulos API

#### Autenticación

- `POST /auth/register` - Registro de usuarios
- `POST /auth/login` - Inicio de sesión
- `GET /auth/profile` - Perfil de usuario

#### Productos

- `GET /products` - Listado con filtros y paginación
- `GET /products/:id` - Producto específico
- `POST /products` - Crear producto (Admin)
- `PUT /products/:id` - Actualizar producto (Admin)
- `DELETE /products/:id` - Eliminar producto (Admin)

#### Usuarios

- `GET /users` - Listado de usuarios (Admin)
- `GET /users/:id` - Usuario específico
- `PUT /users/:id` - Actualizar usuario

## 🐳 Docker

```bash
# Construcción
docker build -t quickcart-api .

# Ejecución con docker-compose
docker-compose up
```

## 📋 Scripts Disponibles

| Script          | Descripción               |
| --------------- | ------------------------- |
| `start:dev`     | Desarrollo con hot-reload |
| `build`         | Compilar para producción  |
| `start:prod`    | Ejecutar en producción    |
| `test`          | Ejecutar tests            |
| `lint`          | Análisis de código        |
| `migration:run` | Ejecutar migraciones      |

## 🔄 Flujo de Desarrollo

1. Crear rama feature desde `main`
2. Implementar cambios con tests
3. Verificar cobertura >80%
4. Pull request con revisión de código
5. Merge después de aprobación

### Convenciones

- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`)
- **Código:** ESLint + Prettier configurados
- **Naming:** camelCase variables, PascalCase clases

## � Roadmap

### Implementado ✅

- Sistema de autenticación JWT
- CRUD completo de productos
- Módulo de usuarios con RBAC
- Documentación API automática

### En Desarrollo 🚧

- Sistema de órdenes y carritos
- Migraciones de base de datos
- Testing exhaustivo

### Planeado 📅

- Cache con Redis
- Notificaciones en tiempo real
- Microservicios
- CI/CD pipeline

## 🤝 Contribución

Proyecto en desarrollo activo. Para contribuir:

1. Fork del repositorio
2. Crear feature branch
3. Implementar con tests
4. Crear pull request

## 📄 Licencia

Proyecto propietario. Todos los derechos reservados.

---

_Construido con 💚 para ofrecer la mejor experiencia de e-commerce_
