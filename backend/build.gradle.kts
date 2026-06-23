plugins {
    java
    id("org.springframework.boot") version "3.3.4"
    id("io.spring.dependency-management") version "1.1.6"
}

group = "com.ellink"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // --- Spring Boot starters ---
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-webflux") // Gemini WebClient
    implementation("org.springframework.boot:spring-boot-starter-actuator") // /actuator/health (배포 헬스체크)

    // --- API docs (Swagger / OpenAPI) ---
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")

    // --- JWT (jjwt) ---
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    // --- PDF: openhtmltopdf (HTML -> PDF, 한글 폰트 임베드) ---
    // pdfbox(텍스트 추출용 PDFTextStripper 포함)는 openhtmltopdf-pdfbox가 전이 제공 (2.0.x)
    implementation("com.openhtmltopdf:openhtmltopdf-core:1.0.10")
    implementation("com.openhtmltopdf:openhtmltopdf-pdfbox:1.0.10")

    // --- 문서 텍스트 추출: docx (Apache POI) ---
    implementation("org.apache.poi:poi-ooxml:5.2.5")

    // --- DB drivers ---
    runtimeOnly("com.h2database:h2")            // dev
    runtimeOnly("org.postgresql:postgresql")    // prod

    // --- Dev tooling ---
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    // --- Test ---
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
