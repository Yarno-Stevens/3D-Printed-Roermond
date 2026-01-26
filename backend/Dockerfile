FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

# Copy pom.xml
COPY pom.xml .

# Download dependencies
RUN apt-get update && apt-get install -y maven && mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Production stage
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]