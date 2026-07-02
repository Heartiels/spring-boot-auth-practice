# Spring Boot Authentication Practice

A small authentication backend built to practice an end-to-end Java/Spring Boot request flow:

```text
HTTP request -> Controller -> Service -> Repository -> MySQL
                                      -> BCrypt password hashing
                                      -> signed JWT response
```

## Current Features

- Register a user with request validation.
- Store a BCrypt password hash instead of plaintext.
- Log in with username and password.
- Return a signed JWT after successful registration or login.
- Validate Bearer JWTs before allowing access to protected endpoints.
- Return the authenticated user's identity from a protected profile endpoint.
- Return a consistent JSON error for invalid credentials.
- Unit tests for authentication logic, JWT verification, filtering, and error handling.

## Tech Stack

- Java 17
- Spring Boot 3.3
- Spring Web
- Spring Data JPA / Hibernate
- Spring Security / BCrypt
- MySQL 8
- JJWT
- Maven
- JUnit 5 / Mockito

## Project Structure

```text
backend/
  pom.xml
  src/main/java/com/haowen/loginpractice/
    auth/       # request DTOs, controller, service, responses
    common/     # API exception handling
    profile/    # protected profile endpoint
    security/   # BCrypt, security rules, JWT generation and validation
    user/       # JPA entity and repository
  src/main/resources/application.yml
  src/test/     # unit tests
sql/
  01_create_database_and_user_table.sql
```

## Prerequisites

Install and verify:

```powershell
java -version
mvn -version
mysql --version
```

You need Java 17 or later, Maven, and a running MySQL 8 server on port `3306`.

## 1. Create the Database

From the repository root:

```powershell
mysql -u root -p < sql/01_create_database_and_user_table.sql
```

If PowerShell does not accept input redirection, open the MySQL client and run:

```sql
SOURCE C:/absolute/path/to/sql/01_create_database_and_user_table.sql;
```

## 2. Configure the Application

The application reads configuration from environment variables. In PowerShell:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/login_practice?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your-mysql-password"
$env:JWT_SECRET="replace-with-a-random-secret-that-is-at-least-32-characters"
```

Do not commit real passwords or production secrets.

## 3. Run Tests

```powershell
cd backend
mvn test
```

## 4. Start the Backend

```powershell
cd backend
mvn spring-boot:run
```

The API starts at `http://localhost:8080`.

## 5. Verify with Postman

### Register

```http
POST http://localhost:8080/api/auth/register
Content-Type: application/json
```

```json
{
  "username": "haowen",
  "password": "test123"
}
```

Expected response:

```json
{
  "userId": 1,
  "username": "haowen",
  "token": "eyJ..."
}
```

### Login

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

```json
{
  "username": "haowen",
  "password": "test123"
}
```

Correct credentials return `200 OK` with a JWT. Invalid credentials return `401 Unauthorized` with:

```json
{
  "error": "Invalid username or password"
}
```

Duplicate usernames and invalid request formats return `400 Bad Request`.

### Protected Profile

First copy the `token` returned by registration or login. Then send:

```http
GET http://localhost:8080/api/profile
Authorization: Bearer eyJ...
```

In Postman, open the `Authorization` tab, select `Bearer Token`, and paste only the token value. Postman creates the `Authorization: Bearer <token>` header for you.

A valid token returns:

```json
{
  "userId": 1,
  "username": "haowen"
}
```

No token, an invalid signature, or an expired token returns `401 Unauthorized`:

```json
{
  "error": "Unauthorized"
}
```

## 6. Run the API Smoke Test

Keep MySQL and the backend running, then open another PowerShell terminal at the repository root:

```powershell
.\scripts\test-api.ps1
```

The script generates a unique username and verifies:

```text
registration       -> 200 and a JWT
login              -> 200 and a JWT
profile, no JWT     -> 401
profile, invalid JWT-> 401
profile, valid JWT  -> 200 and the same user identity
wrong password     -> 401
duplicate username -> 400
invalid input      -> 400
```

Successful output ends with:

```text
All API smoke tests passed.
```

## 7. Inspect Stored Data

```sql
USE login_practice;
SELECT id, username, password_hash, created_at FROM app_users;
```

The `password_hash` value should start with a BCrypt prefix such as `$2a$` or `$2b$`. The original password must never be stored.

To inspect the exact user created by the smoke test, copy the generated username from the script output:

```sql
SELECT
  id,
  username,
  LEFT(password_hash, 4) AS bcrypt_prefix,
  LENGTH(password_hash) AS hash_length,
  password_hash <> 'Test123!' AS not_plaintext
FROM app_users
WHERE username = 'paste_generated_username_here';
```

Expected properties:

```text
bcrypt_prefix is $2a$ or $2b$
hash_length is 60
not_plaintext is 1
```

## Testing Strategy

This project uses two complementary test levels:

1. `mvn test` runs fast JUnit/Mockito tests for authentication decisions and error mapping without requiring a running server.
2. `scripts/test-api.ps1` treats the application as a black box and verifies real HTTP behavior against Spring Boot and MySQL.

The database query is a final persistence check: it proves the user was stored and the password was hashed rather than saved as plaintext.

## API Flow

Registration:

```text
AuthController receives JSON
-> Bean Validation checks username/password format
-> AuthService checks username uniqueness
-> BCryptPasswordEncoder hashes the password
-> AppUserRepository saves the entity through JPA
-> JwtService signs a token
-> AuthResponse is serialized as JSON
```

Login:

```text
AuthController receives JSON
-> AuthService loads the user through AppUserRepository
-> BCryptPasswordEncoder.matches verifies the password
-> JwtService signs a token
-> AuthResponse is returned
```

Protected request:

```text
Client sends Authorization: Bearer <JWT>
-> JwtAuthenticationFilter extracts the token
-> JwtService verifies the signature and expiration
-> the filter stores AuthenticatedUser in Spring Security's SecurityContext
-> Spring Security allows the request
-> ProfileController reads the authenticated principal
-> ProfileResponse is returned as JSON
```

The backend uses stateless authentication: it does not create a server-side login session. Every protected request must carry its JWT. This makes the API easier to scale horizontally, but the token must be protected and must expire.

## Roadmap

- Add integration tests with a test database.
- Add a minimal React login page.
- Add GitHub Actions for automated tests.
