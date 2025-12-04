# QuickCart E-commerce Backend

## Descripción

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

```mermaid
graph TB
    subgraph "🌐 Presentation Layer (API REST)"
        Controllers["🎮 Controllers<br/>━━━━━━━━━━━<br/>• AuthController<br/>• UserController<br/>• ProductController<br/>• OrderController<br/>• StripeController"]
        Guards["🛡️ Security Guards<br/>━━━━━━━━━━━<br/>• JwtAuthGuard<br/>• RolesGuard (RBAC)<br/>• Rate Limiting"]
        Pipes["✅ Validation Pipes<br/>━━━━━━━━━━━<br/>• ValidationPipe<br/>• ParseUUIDPipe<br/>• ParseIntPipe"]
        Decorators["🏷️ Custom Decorators<br/>━━━━━━━━━━━<br/>• @GetUser()<br/>• @Roles()<br/>• @Public()"]
    end

    subgraph "💼 Application Layer (Business Logic)"
        Services["⚙️ Services<br/>━━━━━━━━━━━<br/>• AuthService<br/>• UserService<br/>• ProductService<br/>• OrderService<br/>• StripeService"]
        DTOs["📦 DTOs<br/>━━━━━━━━━━━<br/>• CreateProductDto<br/>• UpdateOrderDto<br/>• LoginDto<br/>• Validation Rules"]
        Interfaces["🔌 Repository Interfaces<br/>━━━━━━━━━━━<br/>• IUserRepository<br/>• IProductRepository<br/>• IOrderRepository<br/>(DIP Pattern)"]
    end

    subgraph "🏛️ Domain Layer (Business Rules)"
        Entities["📋 Entities<br/>━━━━━━━━━━━<br/>• User (UserRole)<br/>• Product<br/>• Order (OrderStatus)<br/>• OrderItem<br/>• CheckoutSession"]
        BusinessRules["📐 Business Rules<br/>━━━━━━━━━━━<br/>• Order.canBeCancelled()<br/>• Price Validation<br/>• Stock Management<br/>• State Transitions"]
        Enums["🏷️ Enums<br/>━━━━━━━━━━━<br/>• UserRole<br/>• OrderStatus<br/>• Session Status"]
    end

    subgraph "💾 Infrastructure Layer (Data Access)"
        Repositories["🗄️ Repositories<br/>━━━━━━━━━━━<br/>• UserRepository<br/>• ProductRepository<br/>• OrderRepository<br/>• CheckoutSessionRepo"]
        TypeORM["🔗 TypeORM<br/>━━━━━━━━━━━<br/>• Query Builder<br/>• Transactions<br/>• Eager Loading<br/>• Migrations"]
        Database["🐘 PostgreSQL<br/>(Supabase)<br/>━━━━━━━━━━━<br/>• ACID Transactions<br/>• Indices<br/>• JSONB Columns"]
    end

    subgraph "🔐 Security & Config"
        JWT["🔑 JWT Strategy<br/>━━━━━━━━━━━<br/>• Token Generation<br/>• Token Validation<br/>• Passport Strategy"]
        Bcrypt["🔒 Bcrypt<br/>━━━━━━━━━━━<br/>• Password Hashing<br/>• Salt Rounds: 12"]
        Config["⚙️ ConfigService<br/>━━━━━━━━━━━<br/>• Environment Vars<br/>• Joi Validation<br/>• Type Safety"]
        CORS["🌍 CORS<br/>━━━━━━━━━━━<br/>• Origin Whitelist<br/>• Credentials: true"]
    end

    subgraph "🔌 External Services"
        Stripe["💳 Stripe API<br/>━━━━━━━━━━━<br/>• Checkout Sessions<br/>• Payment Intents<br/>• Error Handling"]
    end

    subgraph "📊 Monitoring & Logging"
        Logger["📝 Logger Service<br/>━━━━━━━━━━━<br/>• Winston Logger<br/>• Context Tracking<br/>• Error Logs"]
    end

    %% Presentation → Application
    Controllers --> Guards
    Controllers --> Pipes
    Controllers --> Decorators
    Controllers --> Services

    %% Application → Domain
    Services --> Interfaces
    Services --> DTOs
    DTOs --> Entities
    Services --> BusinessRules

    %% Application → Infrastructure
    Interfaces -.->|implements| Repositories

    %% Infrastructure → Database
    Repositories --> TypeORM
    TypeORM --> Database

    %% Domain ← Infrastructure
    Entities <-.->|maps to| TypeORM

    %% Security Integration
    Guards --> JWT
    Guards --> Config
    Services --> Bcrypt
    Controllers --> CORS

    %% External Services
    Services --> Stripe
    Services --> Logger

    %% Styling
    classDef presentation fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef application fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef domain fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef infrastructure fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef security fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef external fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    classDef monitoring fill:#e0f2f1,stroke:#00796b,stroke-width:2px

    class Controllers,Guards,Pipes,Decorators presentation
    class Services,DTOs,Interfaces application
    class Entities,BusinessRules,Enums domain
    class Repositories,TypeORM,Database infrastructure
    class JWT,Bcrypt,Config,CORS security
    class Stripe external
    class Logger monitoring
```

### Seguridad

- Autenticación JWT con refresh tokens
- Autorización basada en roles (RBAC)
- Validación exhaustiva de entrada de datos
- Rate limiting y headers de seguridad
- Cumplimiento OWASP Top 10

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

---

_Construido con 💚 para ofrecer la mejor experiencia de e-commerce_
