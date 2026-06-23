# syntax=docker/dockerfile:1

# ===== Stage 1: build (Gradle + JDK 17) =====
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# 의존성 캐시 레이어: 빌드 스크립트/래퍼 먼저 복사
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew --version >/dev/null 2>&1 || true

# 소스 복사 후 부트 jar 빌드(테스트 제외 — 매뉴얼 검증 스크립트만 존재)
COPY src ./src
RUN ./gradlew clean bootJar -x test --no-daemon

# ===== Stage 2: runtime (JRE 17만) =====
FROM eclipse-temurin:17-jre AS runtime
WORKDIR /app

# 비루트 사용자
RUN groupadd -r app && useradd -r -g app app
COPY --from=build /app/build/libs/*-SNAPSHOT.jar app.jar
USER app

# Railway 등은 PORT를 동적 주입 → application.yml의 ${PORT:8080}가 처리
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
