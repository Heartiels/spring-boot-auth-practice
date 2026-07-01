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
- Return a consistent JSON error for invalid credentials.
- Unit tests for authentication logic and error handling.

The project currently issues JWTs but does not yet validate them on protected endpoints. JWT request filtering and a protected endpoint are planned as the next milestone.

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
    security/   # BCrypt bean, security rules, JWT generation
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

Correct credentials return `200 OK` with a JWT. Invalid credentials currently return `400 Bad Request` with:

```json
{
  "error": "Invalid username or password"
}
```

Changing invalid login responses to `401 Unauthorized` is planned with the JWT authentication filter milestone.

## 6. Inspect Stored Data

```sql
USE login_practice;
SELECT id, username, password_hash, created_at FROM app_users;
```

The `password_hash` value should start with a BCrypt prefix such as `$2a$` or `$2b$`. The original password must never be stored.

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

## Roadmap

- Validate Bearer JWTs with a Spring Security filter.
- Add a protected profile endpoint.
- Add integration tests with a test database.
- Add a minimal React login page.
- Add GitHub Actions for automated tests.

