#Build stage
FROM maven:3.9-eclipse-temurin-23 AS build
WORKDIR /app
#Copy only the definition of libraries
COPY pom.xml .
# Load libraries (cached)
RUN mvn dependency:go-offline
COPY src ./src
#Create one executable
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:23-jre-alpine
WORKDIR /app
# Вземаме само готовия .jar файл от първия етап
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
CMD ["java", "-jar", "app.jar"]